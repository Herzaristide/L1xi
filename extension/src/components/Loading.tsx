import React from 'react'

const Loading: React.FC = () => {
    return (
        <div className="w-80 h-48 p-6 bg-neutral-900 rounded-xl border border-zinc-800 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="text-sm text-zinc-400">Loading...</span>
            </div>
        </div>
    )
}

export default Loading
