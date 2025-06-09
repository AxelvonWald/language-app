# enhanced_tts_generator.py
import os
import re
import azure.cognitiveservices.speech as speechsdk
from supabase import create_client
import tempfile
from pydub import AudioSegment
import io

class MultiLanguageTTSGenerator:
    def __init__(self):
        # Initialize Azure Speech
        self.speech_config = speechsdk.SpeechConfig(
            subscription=os.getenv('AZURE_SPEECH_KEY'),
            region=os.getenv('AZURE_SPEECH_REGION')
        )
        
        # Initialize Supabase with service role
        self.supabase = create_client(
            os.getenv('SUPABASE_URL'), 
            os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        )
        
        # Voice mappings
        self.voices = {
            'en': 'en-US-JennyNeural',  # Clear female English voice
            'es': 'es-ES-AlvaroNeural'  # Clear male Spanish voice
        }
    
    def calculate_pause_duration(self, text, pause_type):
        """Calculate pause duration based on text length and pause type"""
        char_count = len(text.strip())
        
        if pause_type == "repetition":
            return max(2.0, char_count * 0.15 + 1.0)
        elif pause_type == "translation": 
            return max(3.0, char_count * 0.2 + 2.0)
        elif pause_type == "between_sentence":
            return 1.0
        else:
            return float(pause_type.replace('s', ''))  # Handle explicit "[2s]" format
    
    def build_audio_script_file1(self, sentences_data):
        """
        Build script for audio file 1: Native → Pause → Target format
        Returns: "[en] My name is Karl [3.2s] [es] Me llamo Karl [1s] [en] I am from..."
        """
        script_parts = []
        
        for sentence in sentences_data:
            english_text = sentence['native']
            spanish_text = sentence['target'] 
            
            # Calculate pauses
            translation_pause = self.calculate_pause_duration(spanish_text, "translation")
            between_pause = self.calculate_pause_duration("", "between_sentence")
            
            # Add to script: English → translation pause → Spanish → between pause
            script_parts.append(f"[en] {english_text}")
            script_parts.append(f"[{translation_pause:.1f}s]")
            script_parts.append(f"[es] {spanish_text}")
            script_parts.append(f"[{between_pause:.1f}s]")
        
        return " ".join(script_parts)
    
    def build_audio_script_file2(self, sentences_data):
        """
        Build script for audio file 2: Target repeated 5x with pauses
        Returns: "[es] Me llamo Karl [2.1s] [es] Me llamo Karl [2.1s]... (5x per sentence)"
        """
        script_parts = []
        
        for sentence in sentences_data:
            spanish_text = sentence['target']
            
            # Calculate pause for repetition
            repetition_pause = self.calculate_pause_duration(spanish_text, "repetition")
            
            # Repeat each sentence 5 times
            for rep in range(5):
                script_parts.append(f"[es] {spanish_text}")
                script_parts.append(f"[{repetition_pause:.1f}s]")
        
        return " ".join(script_parts)
    
    def parse_and_generate_audio(self, script):
        """
        Parse script like "[en] Hello [2s] [es] Hola [1s]" and generate combined audio
        """
        # Parse the script into segments
        pattern = r'\[(\w+|\d+\.?\d*s)\]\s*([^[]*?)(?=\[|$)'
        segments = re.findall(pattern, script)
        
        audio_segments = []
        
        for tag, content in segments:
            content = content.strip()
            
            if tag.endswith('s'):  # It's a pause like "2s" or "3.5s"
                # Generate silence
                duration_ms = int(float(tag[:-1]) * 1000)
                silence = AudioSegment.silent(duration=duration_ms)
                audio_segments.append(silence)
                
            elif tag in self.voices and content:  # It's a language tag with content
                # Generate TTS for this segment
                audio_data = self.generate_tts_segment(content, tag)
                if audio_data:
                    audio_segment = AudioSegment.from_wav(io.BytesIO(audio_data))
                    audio_segments.append(audio_segment)
        
        # Combine all segments
        if audio_segments:
            combined_audio = sum(audio_segments)
            return combined_audio
        
        return None
    
    def generate_tts_segment(self, text, language):
        """Generate TTS for a single text segment in specified language"""
        try:
            # Set voice for the language
            self.speech_config.speech_synthesis_voice_name = self.voices[language]
            
            # Create synthesizer
            synthesizer = speechsdk.SpeechSynthesizer(speech_config=self.speech_config)
            
            # Generate speech
            result = synthesizer.speak_text_async(text).get()
            
            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                return result.audio_data
            else:
                print(f"TTS failed for '{text}': {result.reason}")
                return None
                
        except Exception as e:
            print(f"Error generating TTS for '{text}': {e}")
            return None
    
    def process_tts_request(self, request_id):
        """Process a single TTS request from the database"""
        try:
            # Get the request
            response = self.supabase.table('tts_requests').select('*').eq('id', request_id).single().execute()
            request = response.data
            
            if not request or request['status'] != 'approved':
                print(f"Request {request_id} not found or not approved")
                return False
            
            print(f"Processing request: {request['audio_filename']} for user {request['user_id']}")
            
            # Parse the combined personalized text back into sentences
            target_sentences = [s.strip() for s in request['personalized_text'].split('.') if s.strip()]
            native_sentences = [s.strip() for s in request['native_text'].split('.') if s.strip()] if request['native_text'] else []
            
            # Combine into sentence objects
            sentences = []
            for i, target in enumerate(target_sentences):
                native = native_sentences[i] if i < len(native_sentences) else f"Sentence {i+1}"
                sentences.append({'target': target, 'native': native})
            
            # Determine which type of audio file to generate
            filename = request['audio_filename']
            
            if 'sentence-1' in filename:
                # File 1: Bilingual with translation pauses
                script = self.build_audio_script_file1(sentences)
                print(f"File 1 script preview: {script[:100]}...")
                
            elif 'sentence-2' in filename:
                # File 2: Spanish only with repetition
                script = self.build_audio_script_file2(sentences)
                print(f"File 2 script preview: {script[:100]}...")
                
            else:
                print(f"Unknown audio file type: {filename}")
                return False
            
            # Generate the audio
            combined_audio = self.parse_and_generate_audio(script)
            
            if combined_audio:
                # Export to MP3
                mp3_buffer = io.BytesIO()
                combined_audio.export(mp3_buffer, format="mp3", bitrate="128k")
                mp3_data = mp3_buffer.getvalue()
                
                # Upload to Supabase Storage
                storage_path = f"personalized/{request['user_id']}/{filename}"
                
                upload_result = self.supabase.storage.from_('audio').upload(
                    storage_path, 
                    mp3_data,
                    file_options={"content-type": "audio/mpeg", "upsert": True}
                )
                
                if upload_result.error:
                    print(f"Upload error: {upload_result.error}")
                    return False
                
                # Get public URL
                url_result = self.supabase.storage.from_('audio').get_public_url(storage_path)
                public_url = url_result.public_url
                
                # Update request status
                self.supabase.table('tts_requests').update({
                    'status': 'completed',
                    'audio_url': public_url,
                    'completed_at': 'now()'
                }).eq('id', request_id).execute()
                
                print(f"✅ Successfully generated: {storage_path}")
                return True
            
            return False
            
        except Exception as e:
            print(f"Error processing request {request_id}: {e}")
            return False

def main():
    """Main function to process TTS requests"""
    generator = MultiLanguageTTSGenerator()
    
    # Get approved requests
    response = generator.supabase.table('tts_requests').select('*').eq('status', 'approved').execute()
    approved_requests = response.data
    
    if not approved_requests:
        print("No approved TTS requests found")
        return
    
    print(f"Found {len(approved_requests)} approved requests")
    
    for request in approved_requests:
        success = generator.process_tts_request(request['id'])
        if success:
            print(f"✅ Completed: {request['audio_filename']}")
        else:
            print(f"❌ Failed: {request['audio_filename']}")

if __name__ == "__main__":
    main()