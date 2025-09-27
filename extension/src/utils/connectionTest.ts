import config from '@/config'

export class ConnectionTest {
    /**
     * Test basic connectivity to the API server
     */
    static async testConnection(): Promise<{
        success: boolean
        message: string
        details?: any
    }> {
        const results: any = {
            timestamp: new Date().toISOString(),
            apiUrl: config.api.baseUrl,
            tests: {}
        }

        try {
            // Test 1: Basic connectivity
            console.log('[ConnectionTest] Testing basic connectivity...')
            results.tests.basicConnectivity = await this.testBasicConnectivity()

            // Test 2: CORS preflight
            console.log('[ConnectionTest] Testing CORS preflight...')
            results.tests.corsTest = await this.testCors()

            // Test 3: Health endpoint
            console.log('[ConnectionTest] Testing health endpoint...')
            results.tests.healthCheck = await this.testHealthEndpoint()

            const allTestsPassed = Object.values(results.tests).every((test: any) => test.success)

            return {
                success: allTestsPassed,
                message: allTestsPassed
                    ? 'All connectivity tests passed'
                    : 'Some connectivity tests failed',
                details: results
            }
        } catch (error) {
            console.error('[ConnectionTest] Error running tests:', error)
            return {
                success: false,
                message: 'Connection test failed',
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    results
                }
            }
        }
    }

    private static async testBasicConnectivity(): Promise<{
        success: boolean
        message: string
        details?: any
    }> {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)

            const response = await fetch(config.api.baseUrl.replace('/api', '') + '/health', {
                method: 'GET',
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            return {
                success: response.ok,
                message: response.ok ? 'Basic connectivity OK' : `HTTP ${response.status}`,
                details: {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries())
                }
            }
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                details: { error }
            }
        }
    }

    private static async testCors(): Promise<{ success: boolean; message: string; details?: any }> {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)

            const response = await fetch(`${config.api.baseUrl}/auth/login`, {
                method: 'OPTIONS',
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            return {
                success: response.ok,
                message: response.ok
                    ? 'CORS preflight OK'
                    : `CORS preflight failed: HTTP ${response.status}`,
                details: {
                    status: response.status,
                    corsHeaders: {
                        'access-control-allow-origin': response.headers.get(
                            'access-control-allow-origin'
                        ),
                        'access-control-allow-methods': response.headers.get(
                            'access-control-allow-methods'
                        ),
                        'access-control-allow-headers': response.headers.get(
                            'access-control-allow-headers'
                        )
                    }
                }
            }
        } catch (error) {
            return {
                success: false,
                message:
                    'CORS test failed: ' +
                    (error instanceof Error ? error.message : 'Unknown error'),
                details: { error }
            }
        }
    }

    private static async testHealthEndpoint(): Promise<{
        success: boolean
        message: string
        details?: any
    }> {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)

            // Try the health endpoint that should exist on your backend
            const response = await fetch(config.api.baseUrl.replace('/api', '') + '/health', {
                method: 'GET',
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (response.ok) {
                const data = await response.json()
                return {
                    success: true,
                    message: 'Health endpoint OK',
                    details: data
                }
            } else {
                return {
                    success: false,
                    message: `Health endpoint failed: HTTP ${response.status}`,
                    details: { status: response.status, statusText: response.statusText }
                }
            }
        } catch (error) {
            return {
                success: false,
                message:
                    'Health endpoint test failed: ' +
                    (error instanceof Error ? error.message : 'Unknown error'),
                details: { error }
            }
        }
    }
}
