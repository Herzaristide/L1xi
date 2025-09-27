import React, { useState, useEffect } from 'react'
import { AuthService } from '@/services/authService'
import { LanguageService, Language } from '@/services/languageService'
import { RegisterRequest } from '@/types/auth'

interface RegisterFormProps {
    onRegisterSuccess: () => void
    onSwitchToLogin: () => void
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
    const [formData, setFormData] = useState<RegisterRequest>({
        email: '',
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        nativeLanguageId: '',
        learningLanguageId: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [languages, setLanguages] = useState<Language[]>([])

    useEffect(() => {
        // Fetch languages from the API
        const fetchLanguages = async () => {
            try {
                const fetchedLanguages = await LanguageService.getLanguages()
                setLanguages(fetchedLanguages)
            } catch (error) {
                console.error('Error fetching languages:', error)
                // Languages service already provides fallback languages
            }
        }

        fetchLanguages()
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        setError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const response = await AuthService.register(formData)

            if (response.success) {
                onRegisterSuccess()
            } else {
                setError(response.message || 'Registration failed')
            }
        } catch (error) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-80 max-h-96 p-6 bg-neutral-900 rounded-xl border border-zinc-800 overflow-y-auto">
            <div className="mb-4">
                <h2 className="text-xl font-semibold text-neutral-50 mb-2">Create Account</h2>
                <p className="text-sm text-zinc-400">Join L1xi to start learning</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label
                            htmlFor="firstName"
                            className="block text-xs font-medium text-neutral-50 mb-1"
                        >
                            First Name
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-2 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-md text-neutral-50 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="First name"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="lastName"
                            className="block text-xs font-medium text-neutral-50 mb-1"
                        >
                            Last Name
                        </label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-2 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-md text-neutral-50 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Last name"
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="username"
                        className="block text-xs font-medium text-neutral-50 mb-1"
                    >
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                        className="w-full px-2 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-md text-neutral-50 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Choose a username"
                    />
                </div>

                <div>
                    <label
                        htmlFor="email"
                        className="block text-xs font-medium text-neutral-50 mb-1"
                    >
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-2 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-md text-neutral-50 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter your email"
                    />
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="block text-xs font-medium text-neutral-50 mb-1"
                    >
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full px-2 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-md text-neutral-50 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Create a password"
                    />
                </div>

                <div>
                    <label
                        htmlFor="nativeLanguageId"
                        className="block text-xs font-medium text-neutral-50 mb-1"
                    >
                        Native Language
                    </label>
                    <select
                        id="nativeLanguageId"
                        name="nativeLanguageId"
                        value={formData.nativeLanguageId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-2 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-md text-neutral-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">Select your native language</option>
                        {languages.map(lang => (
                            <option key={lang.id} value={lang.id}>
                                {lang.flag} {lang.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="learningLanguageId"
                        className="block text-xs font-medium text-neutral-50 mb-1"
                    >
                        Learning Language
                    </label>
                    <select
                        id="learningLanguageId"
                        name="learningLanguageId"
                        value={formData.learningLanguageId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-2 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-md text-neutral-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">Select language to learn</option>
                        {languages
                            .filter(lang => lang.id !== formData.nativeLanguageId)
                            .map(lang => (
                                <option key={lang.id} value={lang.id}>
                                    {lang.flag} {lang.name}
                                </option>
                            ))}
                    </select>
                </div>

                {error && <div className="text-red-400 text-xs">{error}</div>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
                >
                    {loading ? 'Creating Account...' : 'Create Account'}
                </button>
            </form>

            <div className="mt-3 text-center">
                <button
                    onClick={onSwitchToLogin}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                    Already have an account? Login here
                </button>
            </div>
        </div>
    )
}

export default RegisterForm
