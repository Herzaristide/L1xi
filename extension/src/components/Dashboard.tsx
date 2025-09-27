import React, { useEffect, useState } from 'react'
import { User } from '@/types/auth'
import { AuthService } from '@/services/authService'
import { DeckService, DeckStats } from '@/services/deckService'
import { NotificationService } from '@/utils/notifications'

interface DashboardProps {
    user: User
    onLogout: () => void
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
    const [stats, setStats] = useState<DeckStats>({
        totalDecks: 0,
        totalCards: 0,
        studiedToday: 0,
        streak: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            const deckStats = await DeckService.getDeckStats()
            setStats(deckStats)
        } catch (error) {
            console.error('Error loading dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        try {
            await AuthService.logout()
            NotificationService.success('Logged Out', 'You have been logged out successfully')
            onLogout()
        } catch (error) {
            NotificationService.error('Logout Error', 'Failed to logout properly')
            onLogout() // Still logout even if there's an error
        }
    }

    const handleStudyNow = () => {
        // In a real implementation, this would open the study interface
        // For now, we'll just show a notification
        NotificationService.info('Study Feature', 'Study feature coming soon!')
    }

    const handleMyDecks = () => {
        // In a real implementation, this would show the user's decks
        NotificationService.info('Decks Feature', 'Deck management coming soon!')
    }

    return (
        <div className="w-80 p-6 bg-neutral-900 rounded-xl border border-zinc-800">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-neutral-50 mb-2">Welcome back!</h2>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-zinc-400">Logged in as:</span>
                    <span className="text-sm font-medium text-neutral-50">{user.username}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-zinc-800 rounded-md text-zinc-300">
                        {user.subscriptionStatus}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
