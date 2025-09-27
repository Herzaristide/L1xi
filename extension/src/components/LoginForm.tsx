import React from 'react'
import { AuthService } from '@/services/authService'
import { browser } from 'webextension-polyfill-ts'

interface LoginFormProps {
    onLoginSuccess: () => void
    onSwitchToRegister: () => void
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
    const handleWebsiteLogin = async () => {
        await AuthService.openWebsiteLogin()
    }

    const handleWebsiteRegister = async () => {
        // Open the website register page directly instead of using AuthService.register
        try {
            const tabs = await browser.tabs.query({ url: 'http://localhost:3000/*' })

            if (tabs.length > 0) {
                await browser.tabs.update(tabs[0].id!, {
                    url: 'http://localhost:3000/#/register',
                    active: true
                })
                await browser.windows.update(tabs[0].windowId!, { focused: true })
            } else {
                await browser.tabs.create({
                    url: 'http://localhost:3000/#/register',
                    active: true
                })
            }

            window.close()
        } catch (error) {
            window.open('http://localhost:3000/#/register', '_blank')
        }
    }

    return (
        <div className="w-80 p-6 bg-neutral-900 rounded-xl border border-zinc-800">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-neutral-50 mb-2">Welcome to L1xi</h2>
                <p className="text-sm text-neutral-400">
                    Please log in on the L1xi website to continue using the extension.
                </p>
            </div>

            <div className="space-y-4">
                <button
                    onClick={handleWebsiteLogin}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                    Open L1xi Website - Login
                </button>

                <button
                    onClick={handleWebsiteRegister}
                    className="w-full py-2 px-4 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors"
                >
                    Open L1xi Website - Register
                </button>

                <div className="text-center">
                    <p className="text-xs text-neutral-500">
                        The extension will automatically detect when you log in on the website.
                    </p>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800">
                <p className="text-xs text-neutral-400 text-center">
                    L1xi Language Learning Extension
                </p>
            </div>
        </div>
    )
}

export default LoginForm
