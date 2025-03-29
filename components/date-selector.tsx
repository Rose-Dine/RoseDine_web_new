"use client";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface DateSelectorProps {
  selectedDate: Date;
  onPrevious: () => void;
  onNext: () => void;
}

export function DateSelector({ selectedDate, onPrevious, onNext }: DateSelectorProps) {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 5);

  const canGoPrevious = selectedDate > today;
  const canGoNext = selectedDate < maxDate;

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={onPrevious}
        disabled={!canGoPrevious}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <span className="text-lg font-medium">
        {format(selectedDate, "EEEE, MMMM d")}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={onNext}
        disabled={!canGoNext}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}