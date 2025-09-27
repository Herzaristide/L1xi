export interface User {
    id: string
    email: string
    username: string
    firstName?: string
    lastName?: string
    role: 'USER' | 'ADMIN'
    subscriptionStatus: 'FREE' | 'PREMIUM'
    nativeLanguage: {
        id: string
        name: string
        nativeName: string
        flag: string
    }
    learningLanguage: {
        id: string
        name: string
        nativeName: string
        flag: string
    }
    createdAt: string
}

export interface LoginRequest {
    email: string
    password: string
}

export interface RegisterRequest {
    email: string
    username: string
    password: string
    firstName: string
    lastName: string
    nativeLanguageId: string
    learningLanguageId: string
}

export interface AuthResponse {
    success: boolean
    message: string
    data?: {
        user: User
        token: string
    }
    errors?: any[]
}

export interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
}
