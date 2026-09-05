class VolumeEffect {
    constructor (audioContext, volume, startSeconds, endSeconds) {
        this.audioContext = audioContext;

        this.input = this.audioContext.createGain();
        this.output = this.audioContext.createGain();

        this.gain = this.audioContext.createGain();

        // Suavemente sube la ganancia antes de la hora de inicio, y la baja después de la hora de finalización.
        this.rampLength = 0.01;
        this.gain.gain.setValueAtTime(1.0, Math.max(0, startSeconds - this.rampLength));
        this.gain.gain.exponentialRampToValueAtTime(volume, startSeconds);
        this.gain.gain.setValueAtTime(volume, endSeconds);
        this.gain.gain.exponentialRampToValueAtTime(1.0, endSeconds + this.rampLength);

        this.input.connect(this.gain);
        this.gain.connect(this.output);
    }
}

export default VolumeEffect;
