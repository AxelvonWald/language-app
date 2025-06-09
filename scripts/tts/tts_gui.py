# scripts/tts/tts_gui.py
from flask import Flask, render_template, request, jsonify, redirect, url_for
import os
import re
import azure.cognitiveservices.speech as speechsdk
from supabase import create_client
import tempfile
from pydub import AudioSegment
import io
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

class TTSManager:
    def __init__(self):
        # Initialize Azure Speech
        self.speech_config = speechsdk.SpeechConfig(
            subscription=os.getenv('AZURE_SPEECH_KEY'),
            region=os.getenv('AZURE_SPEECH_REGION')
        )
        
        # Initialize Supabase
        self.supabase = create_client(
            os.getenv('SUPABASE_URL'), 
            os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        )
        
        # Voice mappings
        self.voices = {
            'en': 'en-US-JennyNeural',
            'es': 'es-ES-AlvaroNeural'
        }

    def get_pending_requests(self):
        """Get all pending TTS requests"""
        response = self.supabase.table('tts_requests').select('*').eq('status', 'approved').execute()
        return response.data

    def generate_tts_segment(self, text, language):
        """Generate TTS for a text segment"""
        try:
            self.speech_config.speech_synthesis_voice_name = self.voices[language]
            synthesizer = speechsdk.SpeechSynthesizer(speech_config=self.speech_config)
            result = synthesizer.speak_text_async(text).get()
            
            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                return result.audio_data
            return None
        except Exception as e:
            print(f"TTS Error: {e}")
            return None

    def parse_script_and_generate(self, script_text):
        """Parse script and generate audio"""
        # More precise regex pattern
        pattern = r'\[([a-z]{2}|\d+\.?\d*s)\]\s*([^[]*?)(?=\[|$)'
        segments = re.findall(pattern, script_text)
        
        print(f"DEBUG: Parsing script: {script_text}")
        print(f"DEBUG: Found {len(segments)} segments")
        
        audio_segments = []
        
        for i, (tag, content) in enumerate(segments):
            content = content.strip()
            print(f"DEBUG: Segment {i}: tag='{tag}', content='{content}'")
            
            # CHECK LANGUAGE TAGS FIRST (before checking for 's' ending)
            if tag in self.voices and content:  # Language tag with content
                print(f"DEBUG: Generating TTS for [{tag}]: {content}")
                audio_data = self.generate_tts_segment(content, tag)
                if audio_data:
                    audio_segment = AudioSegment.from_wav(io.BytesIO(audio_data))
                    audio_segments.append(audio_segment)
                    print(f"DEBUG: Added TTS segment")
                else:
                    print(f"DEBUG: Failed to generate TTS for: {content}")
                    
            elif tag.endswith('s') and len(tag) > 1:  # Pause like "2s" or "3.5s"
                try:
                    duration_str = tag[:-1]  # Remove 's'
                    print(f"DEBUG: Trying to parse duration: '{duration_str}'")
                    duration_seconds = float(duration_str)
                    duration_ms = int(duration_seconds * 1000)
                    silence = AudioSegment.silent(duration=duration_ms)
                    audio_segments.append(silence)
                    print(f"DEBUG: Added {duration_seconds}s pause")
                except ValueError as e:
                    print(f"DEBUG: Error parsing pause duration '{tag}': {e}")
                    continue
            else:
                print(f"DEBUG: Skipping unrecognized tag: '{tag}'")
        
        if audio_segments:
            print(f"DEBUG: Combining {len(audio_segments)} audio segments")
            combined_audio = sum(audio_segments)
            return combined_audio
        
        print("DEBUG: No audio segments generated")
        return None

    def upload_audio(self, audio_data, user_id, filename):
        """Upload audio to Supabase Storage"""
        storage_path = f"personalized/{user_id}/{filename}"
        
        try:
            # Upload without upsert first
            upload_result = self.supabase.storage.from_('audio').upload(
                path=storage_path,
                file=audio_data,
                file_options={"content-type": "audio/mpeg"}
            )
            
            # Check for errors
            if hasattr(upload_result, 'error') and upload_result.error:
                error_msg = str(upload_result.error).lower()
                if 'already exists' in error_msg or 'duplicate' in error_msg:
                    print("File exists, trying with upsert...")
                    # Try with upsert as string
                    upload_result = self.supabase.storage.from_('audio').upload(
                        path=storage_path,
                        file=audio_data,
                        file_options={"content-type": "audio/mpeg", "upsert": "true"}
                    )
                
                # If still error, report it
                if hasattr(upload_result, 'error') and upload_result.error:
                    print(f"Upload error: {upload_result.error}")
                    return None
            
            # Get public URL
            public_url_response = self.supabase.storage.from_('audio').get_public_url(storage_path)
            return public_url_response
            
        except Exception as e:
            print(f"Upload exception: {e}")
            return None

    def complete_request(self, request_id, audio_url):
        """Mark TTS request as completed"""
        self.supabase.table('tts_requests').update({
            'status': 'completed',
            'audio_url': audio_url,
            'completed_at': 'now()'
        }).eq('id', request_id).execute()

# Initialize TTS Manager
tts_manager = TTSManager()

@app.route('/')
def index():
    """Main page showing pending TTS requests"""
    requests = tts_manager.get_pending_requests()
    return render_template('index.html', requests=requests)

@app.route('/edit/<request_id>')
def edit_request(request_id):
    """Edit page for a specific TTS request"""
    response = tts_manager.supabase.table('tts_requests').select('*').eq('id', request_id).single().execute()
    request_data = response.data
    
    if not request_data:
        return redirect(url_for('index'))
    
    # Parse sentences for editing
    spanish_sentences = [s.strip() for s in request_data['personalized_text'].split('.') if s.strip()]
    english_sentences = [s.strip() for s in request_data['native_text'].split('.') if s.strip()] if request_data['native_text'] else []
    
    # Combine for editing
    sentences = []
    for i, spanish in enumerate(spanish_sentences):
        english = english_sentences[i] if i < len(english_sentences) else f"Sentence {i+1}"
        sentences.append({'english': english, 'spanish': spanish})
    
    return render_template('edit.html', request=request_data, sentences=sentences)

@app.route('/generate', methods=['POST'])
def generate_audio():
    """Generate audio from the edited script"""
    try:
        request_id = request.form['request_id']
        user_id = request.form['user_id']
        filename = request.form['filename']
        script_text = request.form['script_text']
        
        print("=" * 50)
        print(f"GENERATE AUDIO DEBUG:")
        print(f"Request ID: {request_id}")
        print(f"User ID: {user_id}")
        print(f"Filename: {filename}")
        print(f"Script length: {len(script_text)}")
        print(f"Script preview: {script_text[:100]}...")
        print("=" * 50)
        
        # Generate audio
        combined_audio = tts_manager.parse_script_and_generate(script_text)
        
        if combined_audio:
            print("✅ Audio generation successful")
            
            # Export to MP3
            mp3_buffer = io.BytesIO()
            combined_audio.export(mp3_buffer, format="mp3", bitrate="128k")
            mp3_data = mp3_buffer.getvalue()
            
            print(f"✅ MP3 export successful, size: {len(mp3_data)} bytes")
            
            # Upload to Supabase
            audio_url = tts_manager.upload_audio(mp3_data, user_id, filename)
            
            if audio_url:
                print(f"✅ Upload successful: {audio_url}")
                
                # Mark as completed
                tts_manager.complete_request(request_id, audio_url)
                print("✅ Request marked as completed")
                
                return jsonify({'success': True, 'audio_url': audio_url})
            else:
                print("❌ Upload failed")
                return jsonify({'success': False, 'error': 'Upload failed'})
        else:
            print("❌ Audio generation failed")
            return jsonify({'success': False, 'error': 'Audio generation failed'})
        
    except Exception as e:
        print(f"❌ GENERATE ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/preview', methods=['POST'])
def preview_audio():
    """Generate a preview of the audio without saving"""
    try:
        script_text = request.form['script_text']
        
        # Generate audio
        combined_audio = tts_manager.parse_script_and_generate(script_text)
        
        if combined_audio:
            # Save temporary file
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
                combined_audio.export(tmp_file.name, format="mp3", bitrate="128k")
                
                # Return path for preview (you'll need to serve this statically)
                return jsonify({'success': True, 'preview_path': tmp_file.name})
        
        return jsonify({'success': False, 'error': 'Failed to generate preview'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/debug_script', methods=['POST'])
def debug_script():
    """Debug the script parsing"""
    try:
        script_text = request.form['script_text']
        
        print("=" * 50)
        print("DEBUG: Received script:")
        print(repr(script_text))
        print("=" * 50)
        
        # Parse pattern like "[en] Hello [2s] [es] Hola [1s]"
        pattern = r'\[([a-z]{2}|\d+\.?\d*s)\]\s*([^[]*?)(?=\[|$)'
        segments = re.findall(pattern, script_text)
        
        print("DEBUG: Parsed segments:")
        for i, (tag, content) in enumerate(segments):
            print(f"  {i}: tag='{tag}', content='{content.strip()}'")
            
            # Test pause parsing
            if tag.endswith('s'):
                try:
                    duration = float(tag[:-1])
                    print(f"    -> Pause: {duration} seconds")
                except ValueError as e:
                    print(f"    -> ERROR parsing pause: {e}")
            elif tag in ['en', 'es']:
                print(f"    -> TTS: {tag} language")
        
        return jsonify({'success': True, 'segments': len(segments)})
        
    except Exception as e:
        print(f"DEBUG ERROR: {e}")
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)