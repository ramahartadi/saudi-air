import * as React from "react";
import { format, setYear, getYear } from "date-fns";
import { Calendar as CalendarIcon, Search, ChevronDown, ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface BirthDatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  label: string;
  mode?: 'birth' | 'expiry';
}

export function BirthDatePicker({ value, onChange, label, mode = 'birth' }: BirthDatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [isYearView, setIsYearView] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const { fromYear, toYear } = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    if (mode === 'expiry') {
      return {
        fromYear: currentYear,
        toYear: currentYear + 20 // Allowing 20 years for flexibility
      };
    }
    return {
      fromYear: 1920,
      toYear: currentYear
    };
  }, [mode]);

  const years = React.useMemo(() => {
    const yearsArr = [];
    if (mode === 'expiry') {
      for (let i = fromYear; i <= toYear; i++) {
        yearsArr.push(i);
      }
    } else {
      for (let i = toYear; i >= fromYear; i--) {
        yearsArr.push(i);
      }
    }
    return yearsArr;
  }, [fromYear, toYear, mode]);

  const handleSelectYear = (year: number) => {
    const currentProps = date || new Date();
    const newDate = setYear(currentProps, year);
    setDate(newDate);
    onChange(format(newDate, "yyyy-MM-dd"));
    setIsYearView(false);
  };

  const handleSelectDate = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      onChange(format(newDate, "yyyy-MM-dd"));
      setOpen(false); // Close main popover when date is picked
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={(val) => {
        setOpen(val);
        if (!val) setIsYearView(false); // Reset to calendar view when closing
      }}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-bold border-2 border-foreground h-10 px-3 truncate",
              !date && "text-muted-foreground"
            )}
            onClick={() => setOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>{label}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0 border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none z-[100]" align="start">
          {isYearView ? (
            <div className="flex flex-col h-[350px]">
              <div className="p-3 border-b-2 border-foreground bg-secondary flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 border-2 border-foreground"
                  onClick={() => setIsYearView(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="font-black uppercase italic text-xs">Search Year</span>
              </div>
              <Command className="flex-1 rounded-none">
                <CommandInput 
                  placeholder={`Type year (e.g. ${mode === 'expiry' ? '2025' : '1990'})...`} 
                  className="h-10 border-b-2 border-foreground rounded-none px-4" 
                  autoFocus 
                />
                <CommandList className="max-h-none flex-1">
                  <CommandEmpty className="py-6 text-center font-bold text-xs">YEAR NOT FOUND.</CommandEmpty>
                  <CommandGroup>
                    {years.map((y) => (
                      <CommandItem
                        key={y}
                        value={y.toString()}
                        onSelect={() => handleSelectYear(y)}
                        className="py-3 px-4 text-sm font-black uppercase italic hover:bg-primary hover:text-white cursor-pointer"
                      >
                        {y}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          ) : (
            <>
              <div className="p-3 border-b-2 border-foreground bg-secondary">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-2 border-foreground font-black uppercase italic text-xs h-8 flex justify-between px-3"
                  onClick={() => setIsYearView(true)}
                >
                  <span>Select Year: {date ? getYear(date) : "----"}</span>
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleSelectDate}
                month={date}
                onMonthChange={setDate}
                initialFocus
                fromYear={fromYear}
                toYear={toYear}
                className="rounded-none bg-white"
              />
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

