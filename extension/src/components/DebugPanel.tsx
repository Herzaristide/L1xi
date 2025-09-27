import React, { useState, useEffect } from 'react'
import { AuthStorage } from '@/utils/storage'
import { AuthService } from '@/services/authService'
import { ConnectionTest } from '@/utils/connectionTest'
import config from '@/config'

const DebugPanel: React.FC = () => {
    const [debugInfo, setDebugInfo] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (isVisible) {
            loadDebugInfo()
        }
    }, [isVisible])

    const loadDebugInfo = async () => {
        try {
            const authState = await AuthStorage.getAuth()
            const isAuthenticated = await AuthStorage.isAuthenticated()
            const tokenValid = await AuthService.verify()
            const storageDebug = await AuthStorage.getDebugInfo()

            setDebugInfo({
                timestamp: new Date().toISOString(),
                config: {
                    apiUrl: config.api.baseUrl,
                    timeout: config.api.timeout
                },
                auth: {
                    hasToken: !!authState?.token,
                    isAuthenticated,
                    tokenValid,
                    user: authState?.user
                        ? {
                              id: authState.user.id,
                              email: authState.user.email,
                              username: authState.user.username
                          }
                        : null
                },
                storage: storageDebug,
                browser: {
                    userAgent: navigator.userAgent,
                    online: navigator.onLine
                }
            })
        } catch (error) {
            setDebugInfo({
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            })
        }
    }

    const testConnection = async () => {
        setDebugInfo({ ...debugInfo, connectionTest: 'Running...' })
        const connectionResult = await ConnectionTest.testConnection()
        setDebugInfo({
            ...debugInfo,
            connectionTest: connectionResult
        })
    }

    if (!isVisible) {
        return (
            <div className="fixed bottom-2 right-2">
                <button
                    onClick={() => setIsVisible(true)}
                    className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                    title="Show debug info"
                >
                    🐛
                </button>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-neutral-900 border border-zinc-700 rounded-lg p-4 max-w-lg max-h-96 overflow-auto">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-neutral-50">Debug Info</h3>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-zinc-400 hover:text-neutral-50"
                    >
                        ✕
                    </button>
                </div>

                <pre className="text-xs text-zinc-300 bg-zinc-800 p-3 rounded overflow-auto">
                    {debugInfo ? JSON.stringify(debugInfo, null, 2) : 'Loading...'}
                </pre>

                <div className="mt-3 flex gap-2 flex-wrap">
                    <button
                        onClick={loadDebugInfo}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={testConnection}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Test Connection
                    </button>
                    <button
                        onClick={() => {
                            navigator.clipboard?.writeText(JSON.stringify(debugInfo, null, 2))
                        }}
                        className="px-3 py-1 text-xs bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600"
                    >
                        Copy
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DebugPanel
