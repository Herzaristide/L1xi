// Configuration for the L1xi Extension
export const config = {
    // API Configuration
    api: {
        baseUrl:
            process.env.NODE_ENV === 'production'
                ? 'http://localhost:5000/api' // Replace with actual production URL
                : 'http://localhost:5000/api',
        timeout: 10000
    },

    // Storage Configuration
    storage: {
        keys: {
            auth: 'l1xi_auth',
            preferences: 'l1xi_preferences'
        }
    },

    // Extension Configuration
    extension: {
        name: 'L1xi Language Learning',
        version: '1.0.0'
    }
}

export default config
