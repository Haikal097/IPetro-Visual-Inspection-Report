import logo from '@/assets/logo.png';

export default function AppLogo() {
    return (
        <>
            <div className="flex items-center">
                <img 
                    src={logo} 
                    alt="Logo" 
                    className="h-8 w-8 object-contain"
                />
                <div className="ml-2 text-left text-sm">
                    <span className="font-semibold leading-tight">
                        iPetro Inspection Tools
                    </span>
                </div>
            </div>
        </>
    );
}
