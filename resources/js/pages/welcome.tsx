import { dashboard, login } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { BarChart3, CheckCircle, FileText, Image as ImageIcon, Shield, Users, Camera, Search, Settings } from 'lucide-react';
import ipetroLogo from '@/assets/logo.png';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="iPetro Inspection Tools | Asset Integrity Management">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700"
                    rel="stylesheet"
                />
            </Head>
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900 dark:from-gray-900 dark:to-gray-950 dark:text-white">
                {/* Navigation */}
                <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img 
                                    src={ipetroLogo} 
                                    alt="iPetro Inspection Tools Logo" 
                                    className="h-10 w-auto"
                                />
                                <div>
                                    <span className="text-lg font-bold text-[#CD202C]">iPetro</span>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-1">
                                        Inspection Tools
                                    </span>
                                </div>
                            </div>
                            <nav className="flex items-center gap-4">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex items-center gap-2 rounded-lg bg-[#CD202C] px-6 py-2.5 font-medium text-white transition-all hover:bg-[#B81C26] hover:shadow-lg"
                                    >
                                        <BarChart3 className="h-5 w-5" />
                                        Dashboard
                                    </Link>
                                ) : (
                                    <Link
                                        href={login()}
                                        className="rounded-lg bg-[#CD202C] px-6 py-2.5 font-medium text-white transition-all hover:bg-[#B81C26] hover:shadow-lg"
                                    >
                                        Sign In
                                    </Link>
                                )}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <main>
                    <section className="relative overflow-hidden py-20 sm:py-32">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(205,32,44,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(205,32,44,0.1)_0%,transparent_50%)]"></div>
                        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="grid lg:grid-cols-2 lg:gap-16 items-center">
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                                        <span className="block">Professional</span>
                                        <span className="block text-[#CD202C]">Inspection Tools</span>
                                        <span className="block text-gray-600 dark:text-gray-300 text-2xl mt-4">
                                            For the Oil & Gas Industry
                                        </span>
                                    </h1>
                                    <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
                                        Streamline your asset inspection workflows with comprehensive photo reports, 
                                        real-time tracking, and standardized documentation for compliance and safety.
                                    </p>
                                    <div className="mt-10 flex flex-col sm:flex-row gap-4">
                                        {auth.user ? (
                                            <Link
                                                href={dashboard()}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#CD202C] px-8 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#B81C26] hover:shadow-xl"
                                            >
                                                <BarChart3 className="h-5 w-5" />
                                                Go to Dashboard
                                            </Link>
                                        ) : (
                                            <Link
                                                href={login()}
                                                className="inline-flex items-center justify-center rounded-lg bg-[#CD202C] px-8 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#B81C26] hover:shadow-xl"
                                            >
                                                <Settings className="h-5 w-5 mr-2" />
                                                Access System
                                            </Link>
                                        )}
                                    </div>
                                    <div className="mt-8 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            <span>Enterprise Security</span>
                                        </div>
                                        <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            <span>Role-based Access</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative mt-10 lg:mt-0">
                                    <div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
                                        <div className="space-y-4">
                                            {/* Mock Report Header */}
                                            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                            <Camera className="h-4 w-4" />
                                                            Photo Inspection Report
                                                        </div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                            RPT-2024-0015 • PMT: Vessel • Tag: V-1001
                                                        </div>
                                                    </div>
                                                    <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                                        Submitted
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mock Quick Stats */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                                                    <div className="text-center">
                                                        <div className="text-xl font-bold text-gray-900 dark:text-white">8</div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">Photos</div>
                                                    </div>
                                                </div>
                                                <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                                                    <div className="text-center">
                                                        <div className="text-xl font-bold text-gray-900 dark:text-white">12</div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">Items</div>
                                                    </div>
                                                </div>
                                                <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                                                    <div className="text-center">
                                                        <div className="text-xl font-bold text-gray-900 dark:text-white">5</div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">Findings</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mock Recent Activities */}
                                            <div className="rounded-lg border border-gray-200 dark:border-gray-700">
                                                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                                                    <div className="text-sm font-semibold flex items-center gap-2">
                                                        <Search className="h-4 w-4" />
                                                        Recent Activities
                                                    </div>
                                                </div>
                                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                                    <div className="px-4 py-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-sm font-medium">Visual Inspection - V-1001</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                2 hours ago
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="px-4 py-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-sm font-medium">Corrosion Assessment - P-2002</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                1 day ago
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                    Professional Inspection Workflow Tools
                                </h2>
                                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                                    Everything you need for efficient asset inspection management
                                </p>
                            </div>
                            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                    <div className="mb-4 inline-flex rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
                                        <Camera className="h-6 w-6 text-red-600 dark:text-red-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold">Photo Documentation</h3>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                                        Capture and annotate inspection photos with detailed findings and requirements.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                    <div className="mb-4 inline-flex rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold">Standardized Reports</h3>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                                        Generate consistent inspection reports following industry standards and templates.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                    <div className="mb-4 inline-flex rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold">Workflow Management</h3>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                                        Track inspection status from draft to review, approval, and submission.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                    <div className="mb-4 inline-flex rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                                        <Search className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold">Findings Tracking</h3>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                                        Monitor and manage inspection findings with requirement assignments.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                    <div className="mb-4 inline-flex rounded-lg bg-amber-100 p-3 dark:bg-amber-900/30">
                                        <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold">Compliance Assurance</h3>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                                        Ensure regulatory compliance with built-in standards and audit trails.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                    <div className="mb-4 inline-flex rounded-lg bg-indigo-100 p-3 dark:bg-indigo-900/30">
                                        <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold">Asset Analytics</h3>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                                        Gain insights with comprehensive analytics on inspection history and trends.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Access Information Section */}
                    <section className="py-16 bg-white dark:bg-gray-900">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-8 dark:from-gray-800 dark:to-gray-900">
                                <div className="text-center">
                                    <div className="inline-flex items-center gap-3 mb-4">
                                        <Settings className="h-8 w-8 text-[#CD202C]" />
                                        <h3 className="text-2xl font-bold">System Access</h3>
                                    </div>
                                    <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                                        <strong>iPetro Inspection Tools</strong> is an enterprise system with controlled access.
                                        User accounts are managed by authorized administrators to ensure security and compliance.
                                    </p>
                                    <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            <span className="font-medium">Need access?</span> Contact your system administrator
                                        </div>
                                        <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 hidden sm:block"></div>
                                        {!auth.user && (
                                            <Link
                                                href={login()}
                                                className="rounded-lg bg-[#CD202C] px-6 py-2.5 font-medium text-white transition-all hover:bg-[#B81C26] hover:shadow-lg"
                                            >
                                                Sign In to Existing Account
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="py-20">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="rounded-2xl bg-gradient-to-r from-[#CD202C] to-[#B81C26] px-8 py-12 sm:px-12 sm:py-16">
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold text-white sm:text-4xl">
                                        Ready to Streamline Your Inspection Process?
                                    </h2>
                                    <p className="mx-auto mt-4 max-w-2xl text-lg text-red-100">
                                        Join industry professionals using iPetro Inspection Tools for efficient asset management.
                                    </p>
                                    <div className="mt-10">
                                        {auth.user ? (
                                            <Link
                                                href={dashboard()}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-3 text-base font-semibold text-[#CD202C] shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl"
                                            >
                                                <BarChart3 className="h-5 w-5" />
                                                Continue to Dashboard
                                            </Link>
                                        ) : (
                                            <Link
                                                href={login()}
                                                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-base font-semibold text-[#CD202C] shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl"
                                            >
                                                <Settings className="h-5 w-5 mr-2" />
                                                Access Inspection Tools
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="border-t border-gray-200 bg-white py-12 dark:border-gray-800 dark:bg-gray-900">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
                            <div className="flex items-center gap-3">
                                <img 
                                    src={ipetroLogo} 
                                    alt="iPetro Inspection Tools Logo" 
                                    className="h-8 w-auto"
                                />
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-bold text-[#CD202C]">iPetro</span>
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            Inspection Tools
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Enterprise Asset Integrity Management System
                                    </p>
                                </div>
                            </div>
                            <div className="text-center md:text-right">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    © {new Date().getFullYear()} iPetro Inspection Tools.
                                    <br />
                                    Enterprise system. All rights reserved.
                                </p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}