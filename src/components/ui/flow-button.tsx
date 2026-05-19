import { ArrowRight } from 'lucide-react';

interface FlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  variant?: "solid" | "outline";
}

export function FlowButton({ text = "Modern Button", className = "", variant = "solid", ...props }: FlowButtonProps) {
  if (variant === "outline") {
    return (
      <button 
        className={`group relative flex items-center justify-center gap-1 overflow-hidden rounded-[100px] border-[1.5px] border-[#333333]/40 dark:border-white/40 bg-transparent px-8 py-3 text-sm font-semibold text-[#111111] dark:text-white cursor-pointer transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-transparent hover:text-white dark:hover:text-black hover:rounded-[12px] active:scale-[0.95] select-none ${className}`}
        {...props}
      >
        {/* Left arrow (arr-2) */}
        <ArrowRight 
          className="absolute w-4 h-4 left-[-25%] stroke-[#111111] dark:stroke-white fill-none z-[9] group-hover:left-4 group-hover:stroke-white dark:group-hover:stroke-black transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" 
        />

        {/* Text */}
        <span className="relative z-[1] -translate-x-3 group-hover:translate-x-3 transition-all duration-[800ms] ease-out">
          {text}
        </span>

        {/* Circle */}
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#111111] dark:bg-white rounded-[50%] opacity-0 group-hover:w-[260px] group-hover:h-[260px] group-hover:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)]"></span>

        {/* Right arrow (arr-1) */}
        <ArrowRight 
          className="absolute w-4 h-4 right-4 stroke-[#111111] dark:stroke-white fill-none z-[9] group-hover:right-[-25%] group-hover:stroke-white dark:group-hover:stroke-black transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" 
        />
      </button>
    );
  }

  // Solid variant (stay black/white completely by default)
  return (
    <button 
      className={`group relative flex items-center justify-center gap-1 overflow-hidden rounded-[100px] border-[1.5px] border-[#111111] dark:border-white bg-[#111111] dark:bg-white px-8 py-3 text-sm font-semibold text-white dark:text-black cursor-pointer transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-transparent hover:text-[#111111] dark:hover:text-white hover:rounded-[12px] active:scale-[0.95] select-none ${className}`}
      {...props}
    >
      {/* Left arrow (arr-2) */}
      <ArrowRight 
        className="absolute w-4 h-4 left-[-25%] stroke-white dark:stroke-black fill-none z-[9] group-hover:left-4 group-hover:stroke-[#111111] dark:group-hover:stroke-white transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" 
      />

      {/* Text */}
      <span className="relative z-[1] -translate-x-3 group-hover:translate-x-3 transition-all duration-[800ms] ease-out">
        {text}
      </span>

      {/* Right arrow (arr-1) */}
      <ArrowRight 
        className="absolute w-4 h-4 right-4 stroke-white dark:stroke-black fill-none z-[9] group-hover:right-[-25%] group-hover:stroke-[#111111] dark:group-hover:stroke-white transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" 
      />
    </button>
  );
}
