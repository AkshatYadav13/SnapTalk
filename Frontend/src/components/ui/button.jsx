import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300",
  {
    variants: {
      variant: {
        default: "bg-[#4B70F5] rounded-[50px] hover:bg-gray-300 hover:text-slate-900  text-[16px] font-normal text-slate-50 ",
        destructive:
          "rounded-[50px] text-[16px] font-normal bg-red-400 text-slate-50 hover:bg-gray-300 hover:text-slate-900 dark:bg-red-900 dark:text-slate-50 dark:hover:bg-red-900/90",
        outline:
          "rounded-[50px] text-[16px] font-normal text-red-500  border border-slate-200 bg-slate-100 hover:bg-slate-200  hover:text-red-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        secondary:
          "rounded-[50px] text-[16px] font-normal text-slate-900 border border-gray-500 hover:bg-gray-200 bg-white dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700",
        ghost: "text-[16px] font-normal hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        link: "text-[16px] font-normal text-slate-900 underline-offset-4 hover:underline dark:text-slate-50",
      },
      size: {
        default: "h-10 px-8 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }


