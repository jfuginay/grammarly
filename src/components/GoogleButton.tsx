import { AuthContext } from "@/contexts/AuthContext";
import { useContext } from "react";
import { FcGoogle } from 'react-icons/fc';
import { useIsIFrame } from "@/hooks/useIsIFrame";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const GoogleButton = () => {
  const { signInWithGoogle } = useContext(AuthContext);
  const { isIframe } = useIsIFrame();

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const button = (
    <button
      onClick={signInWithGoogle}
      disabled={isIframe}
      className={`w-full flex items-center justify-center px-4 py-2 border border-neutral-700 rounded-md text-neutral-100 bg-neutral-800 ${
        !isIframe && "hover:bg-neutral-700"
      } transition-colors duration-200 ${
        isIframe && "opacity-50 cursor-not-allowed"
      }`}
    >
      <FcGoogle className="mr-2" />
      Continue with Google
    </button>
  );

  return (
    <div className="h-10 w-full">
      {isIframe ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <p>Google Sign In is only available in the browser, not within developer mode. Click <button onClick={handleOpenNewTab} className="text-blue-500 hover:underline">here</button> to open in a new tab.</p>
                <p>Make sure Google Sign In is configured in your Supabase project settings.</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        button
      )}
    </div>
  );
};

export default GoogleButton;
