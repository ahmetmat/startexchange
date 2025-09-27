    'use client'

    import Link from 'next/link'
    import { usePathname } from 'next/navigation'
    import { memo, type ReactNode } from 'react'
    import { Rocket, Sparkles } from 'lucide-react'

    export type NavItem = {
    href: string
    label: string
    }

    const DEFAULT_NAV_ITEMS: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Competitions', href: '/competitions' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Trading', href: '/trading' },
    ]

    type MainHeaderProps = {
    navItems?: NavItem[]
    /** Aktif sayfayı manuel vurgulamak istersen (örn. dinamik route’larda) */
    highlightPath?: string
    /** Sağ tarafa istediğin bileşeni geç (cüzdan butonları vs) */
    rightSlot?: ReactNode
    /** Logonun yanında parıltı efekti */
    showSparkles?: boolean
    className?: string
    }

    const isActive = (currentPath: string, targetPath: string) => {
    if (targetPath === '/') return currentPath === '/'
    return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
    }

    function MainHeaderImpl({
    navItems = DEFAULT_NAV_ITEMS,
    highlightPath,
    rightSlot,
    showSparkles = false,
    className = '',
    }: MainHeaderProps) {
    const pathname = usePathname() ?? '/'
    const activePath = highlightPath ?? pathname

    return (
        <header className={`bg-white/80 backdrop-blur-sm border-b border-orange-200/50 shadow-sm relative z-20 ${className}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
            {/* Brand */}
            <div className="group flex items-center space-x-3">
                <div className="relative">
                <Rocket className="h-10 w-10 text-orange-500 transition-all duration-300 group-hover:rotate-6 group-hover:text-red-500" />
                {showSparkles && (
                    <Sparkles className="absolute -right-1 -top-1 h-4 w-4 animate-pulse text-yellow-400" />
                )}
                </div>
                <span className="bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-3xl font-black text-transparent">
                StartEx
                </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden items-center space-x-8 md:flex">
                {navItems.map((item) => {
                const active = isActive(activePath, item.href)
                return (
                    <Link
                    key={`${item.label}-${item.href}`}
                    href={item.href}
                    className={`group relative text-sm font-medium transition-colors duration-300 ${
                        active ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600'
                    }`}
                    >
                    {item.label}
                    <span
                        className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300 ${
                        active ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}
                    />
                    </Link>
                )
                })}
            </nav>

            {/* Right slot (wallet controls vs.) */}
            <div className="flex items-center space-x-2">
                {rightSlot}
            </div>
            </div>
        </div>
        </header>
    )
    }

    export const MainHeader = memo(MainHeaderImpl)
    export default MainHeader