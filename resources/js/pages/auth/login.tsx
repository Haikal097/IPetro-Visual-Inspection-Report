import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { 
  Eye, EyeOff, Lock, Mail, ChevronRight, 
  AlertCircle, CheckCircle, BarChart, Zap, Key, Factory,
  Shield, ShieldCheck, Database, Clock, TrendingUp, Users,
  Target, Server, Cpu, FileCheck, Cloud, Bell
} from 'lucide-react';
import { useState } from 'react';
import ipetroLogo from '@/assets/logo.png';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [passwordType, setPasswordType] = useState<'password' | 'text'>('password');

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
        setPasswordType(showPassword ? 'password' : 'text');
    };

    const features = [
        {
            icon: <BarChart className="w-6 h-6" />,
            title: "API 510 Compliant",
            description: "Industry-standard inspection reports",
            gradient: "from-red-600 to-orange-600"
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: "Fast & Efficient",
            description: "50% faster reporting time",
            gradient: "from-blue-600 to-cyan-600"
        },
        {
            icon: <Key className="w-6 h-6" />,
            title: "Secure Platform",
            description: "Enterprise-grade security protocols",
            gradient: "from-emerald-600 to-green-600"
        },
        {
            icon: <Factory className="w-6 h-6" />,
            title: "Asset Management",
            description: "Complete equipment lifecycle tracking",
            gradient: "from-purple-600 to-pink-600"
        }
    ];

    const systemStats = [
        { icon: <Database className="w-4 h-4" />, value: "5,000+", label: "Assets Tracked" },
        { icon: <Clock className="w-4 h-4" />, value: "99.8%", label: "Uptime" },
        { icon: <TrendingUp className="w-4 h-4" />, value: "250+", label: "Active Users" },
        { icon: <FileCheck className="w-4 h-4" />, value: "50%", label: "Time Saved" }
    ];

    return (
        <AuthLayout className="min-h-screen dark">
            <Head title="Sign In | iPetro" />

            {/* Main Container */}
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
                {/* Background Pattern */}
                <div className="absolute inset-0 overflow-hidden opacity-10">
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-r from-[#CD202C] to-[#8B0000] rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-r from-blue-900 to-purple-900 rounded-full blur-3xl"></div>
                </div>

                <div className="relative min-h-screen flex items-center justify-center p-4">
                    <div className="w-full max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                            {/* Left Panel - Brand & Features */}
                            <div className="space-y-10">
                                {/* Brand Header */}
                                <div className="space-y-6">
<div className="flex items-center gap-4">
    <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
        <img 
            src={ipetroLogo} 
            alt="iPetro Logo" 
            className="w-full h-full object-contain"
        />
    </div>
    <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
            iPetro
        </h1>
        <p className="text-gray-400 text-sm">Asset Integrity Management System</p>
    </div>
</div>

                                    <div>
                                        <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
                                            Professional
                                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#CD202C] to-[#FF6B6B]">
                                                Inspection Platform
                                            </span>
                                        </h2>
                                        <p className="text-gray-300 text-lg max-w-lg">
                                            Streamline your asset inspection workflow with enterprise-grade tools 
                                            designed for the oil & gas industry.
                                        </p>
                                    </div>
                                </div>

                                {/* Features Grid */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-semibold text-gray-200">Core Features</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {features.map((feature, index) => (
                                            <div 
                                                key={index}
                                                className="group p-5 rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-800/30 hover:border-gray-700 transition-all duration-300"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                                        {feature.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-100 mb-1">
                                                            {feature.title}
                                                        </h4>
                                                        <p className="text-sm text-gray-400">
                                                            {feature.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Certification Badges */}
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/50 border border-gray-800">
                                        <Target className="w-4 h-4 text-[#CD202C]" />
                                        <span className="text-sm font-medium">API 510 Certified</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/50 border border-gray-800">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        <span className="text-sm font-medium">ISO 9001:2015</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel - Login Form */}
                            <div className="flex items-center">
                                <div className="w-full max-w-md mx-auto">
                                    <div className="p-8 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-900/90 backdrop-blur-sm shadow-2xl shadow-black/50">
                                        {/* Form Header */}
                                        <div className="text-center mb-8">
                                            <h2 className="text-2xl font-bold text-white mb-2">
                                                Sign In
                                            </h2>
                                            <p className="text-gray-400">
                                                Enter your credentials to access the system
                                            </p>
                                        </div>

                                        {/* Status Message */}
                                        {status && (
                                            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-900/30 to-green-900/30 border border-emerald-800/50 flex items-center gap-3">
                                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                                <p className="text-emerald-300 text-sm">{status}</p>
                                            </div>
                                        )}

                                        {/* Login Form */}
                                        <Form
                                            {...store.form()}
                                            resetOnSuccess={['password']}
                                            className="space-y-6"
                                        >
                                            {({ processing, errors }) => (
                                                <>
                                                    {/* Email Field */}
                                                    <div className="space-y-3">
                                                        <Label htmlFor="email" className="text-gray-300 font-medium">
                                                            Email Address
                                                        </Label>
                                                        <div className="relative group">
                                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                                <Mail className="h-5 w-5 text-gray-500 group-hover:text-[#CD202C] transition-colors" />
                                                            </div>
                                                            <Input
                                                                id="email"
                                                                type="email"
                                                                name="email"
                                                                required
                                                                autoFocus
                                                                tabIndex={1}
                                                                autoComplete="email"
                                                                placeholder="you@company.com"
                                                                className="pl-12 h-12 bg-gray-900 border-2 border-gray-800 focus:border-[#CD202C] focus:ring-2 focus:ring-[#CD202C]/20 transition-all duration-300 rounded-xl text-white placeholder-gray-600"
                                                            />
                                                        </div>
                                                        <InputError message={errors.email} className="text-red-400 text-sm" />
                                                    </div>

                                                    {/* Password Field */}
                                                    <div className="space-y-3">
                                                        <Label htmlFor="password" className="text-gray-300 font-medium">
                                                            Password
                                                        </Label>
                                                        <div className="relative group">
                                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                                <Lock className="h-5 w-5 text-gray-500 group-hover:text-[#CD202C] transition-colors" />
                                                            </div>
                                                            <Input
                                                                id="password"
                                                                type={passwordType}
                                                                name="password"
                                                                required
                                                                tabIndex={2}
                                                                autoComplete="current-password"
                                                                placeholder="••••••••"
                                                                className="pl-12 pr-12 h-12 bg-gray-900 border-2 border-gray-800 focus:border-[#CD202C] focus:ring-2 focus:ring-[#CD202C]/20 transition-all duration-300 rounded-xl text-white placeholder-gray-600"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={togglePasswordVisibility}
                                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                                                                tabIndex={3}
                                                            >
                                                                {showPassword ? (
                                                                    <EyeOff className="h-5 w-5" />
                                                                ) : (
                                                                    <Eye className="h-5 w-5" />
                                                                )}
                                                            </button>
                                                        </div>
                                                        <InputError message={errors.password} className="text-red-400 text-sm" />
                                                    </div>

                                                    {/* Form Options */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <Checkbox
                                                                id="remember"
                                                                name="remember"
                                                                tabIndex={4}
                                                                className="border-gray-700 data-[state=checked]:bg-[#CD202C] data-[state=checked]:border-[#CD202C] bg-gray-900"
                                                            />
                                                            <Label htmlFor="remember" className="text-gray-300 text-sm cursor-pointer select-none">
                                                                Remember me
                                                            </Label>
                                                        </div>
                                                        {canResetPassword && (
                                                            <TextLink
                                                                href={request()}
                                                                className="text-sm text-gray-400 hover:text-[#CD202C] transition-colors"
                                                                tabIndex={5}
                                                            >
                                                                Forgot password?
                                                            </TextLink>
                                                        )}
                                                    </div>

                                                    {/* Submit Button */}
                                                    <Button
                                                        type="submit"
                                                        className="w-full h-12 bg-gradient-to-r from-[#CD202C] via-[#B81C26] to-[#8B0000] hover:from-[#B81C26] hover:via-[#CD202C] hover:to-[#B81C26] text-white font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 rounded-xl group"
                                                        tabIndex={5}
                                                        disabled={processing}
                                                        data-test="login-button"
                                                    >
                                                        {processing ? (
                                                            <>
                                                                <Spinner className="mr-3" />
                                                                Signing in...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="mr-2">Sign In</span>
                                                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                            </>
                                                        )}
                                                    </Button>
                                                </>
                                            )}
                                        </Form>

                                        {/* Support Info */}
                                        <div className="mt-8 p-4 rounded-xl bg-gray-900/50 border border-gray-800">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-[#CD202C] flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm text-gray-300">
                                                        For any login issues or account access problems, 
                                                        please contact your system administrator or email{' '}
                                                        <a href="mailto:support@ipetro.com" className="text-[#CD202C] hover:underline">
                                                            support@ipetro.com
                                                        </a>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-12 text-center text-sm text-gray-500">
                            <p>© {new Date().getFullYear()} iPetro Asset Integrity Management System. All rights reserved.</p>
                            <div className="flex items-center justify-center gap-4 mt-2">
                                <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
                                <span className="text-gray-600">•</span>
                                <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
                                <span className="text-gray-600">•</span>
                                <a href="#" className="hover:text-gray-300 transition-colors">Documentation</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}