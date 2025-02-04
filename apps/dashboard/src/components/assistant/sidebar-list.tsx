import { cn } from "@midday/ui/cn";
import { useClickAway } from "@uidotdev/usehooks";
import { SidebarItems } from "./sidebar-items";
import { Toolbar } from "./toolbar";

type Props = {
  isExpanded: boolean;
  chatId?: string;
  setExpanded: (value: boolean) => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
};

export function SidebarList({
  isExpanded,
  chatId,
  setExpanded,
  onSelect,
  onNewChat,
}: Props) {
  const ref = useClickAway((event) => {
    // Only close if clicking outside the sidebar
    const target = event.target as HTMLElement;
    if (!target.closest('.assistant-toggle')) {
      setExpanded(false);
    }
  });

  return (
    <div className="relative">
      <div
        ref={ref}
        className={cn(
          "w-[220px] h-screen md:h-[477px] bg-background dark:bg-[#131313] fixed left-0 top-0 bottom-[1px] duration-200 ease-out transition-all border-border border-r-[1px] z-[100] transform -translate-x-full",
          isExpanded && "translate-x-0"
        )}
      >
        <SidebarItems onSelect={onSelect} chatId={chatId} />
        <Toolbar onNewChat={onNewChat} />
        <div className="absolute z-10 h-[477px] w-[45px] bg-gradient-to-r from-background/30 dark:from-[#131313]/30 to-background right-0 top-0 pointer-events-none" />
      </div>

      {isExpanded && (
        <div
          className="fixed inset-0 bg-background/80 z-[99]"
          onClick={() => setExpanded(false)}
        />
      )}
    </div>
  );
}
