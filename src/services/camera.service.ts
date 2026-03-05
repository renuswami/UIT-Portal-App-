/**
 * Reusable Camera captures logic
 */
export const cameraService = {
    /**
     * Configuration for capture
     */
    getCaptureOptions() {
        return {
            base64: true,
            quality: 0.5,
        };
    },

    /**
     * Front camera requirement
     */
    getFacing(): 'front' | 'back' {
        return 'front';
    }
};
