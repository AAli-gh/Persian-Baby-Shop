import { useEffect, useState } from "react";

interface CountdownProps {
  targetDate: string;
}

export function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        timeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }

      setTimeLeft(timeLeft);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold" dir="ltr">
      <div className="flex flex-col items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-background/90 text-foreground rounded-lg shadow-sm border border-border/50">
        {timeLeft.seconds.toString().padStart(2, '0')}
      </div>
      <span className="text-muted-foreground">:</span>
      <div className="flex flex-col items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-background/90 text-foreground rounded-lg shadow-sm border border-border/50">
        {timeLeft.minutes.toString().padStart(2, '0')}
      </div>
      <span className="text-muted-foreground">:</span>
      <div className="flex flex-col items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-background/90 text-foreground rounded-lg shadow-sm border border-border/50">
        {timeLeft.hours.toString().padStart(2, '0')}
      </div>
      {timeLeft.days > 0 && (
        <>
          <span className="text-muted-foreground">:</span>
          <div className="flex flex-col items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 text-primary rounded-lg shadow-sm">
            {timeLeft.days}
          </div>
        </>
      )}
    </div>
  );
}
