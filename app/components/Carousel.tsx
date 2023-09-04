import classNames from "classnames";
import { useEffect, useState } from "react";

import { Icon } from "~/icons/App";

const TESTIMONIALS = [
  {
    text: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Aperiam laborum cumque commodi, vel reiciendis repudiandae corporis",
    name: "Akam Foad",
    position: "Lead Frontend Developer",
    avatar: "https://avatars.githubusercontent.com/u/41629832?v=4",
  },
  {
    text: "voluptas aliquid quod officia, accusantium veniam modi, laudantium reprehenderit soluta perspiciatis id molestias? Error, exercitationem?",
    name: "Ahmed Nehmat",
    position: "Frontend Developer",
    avatar: "https://avatars.githubusercontent.com/u/51075069?v=4",
  },
  {
    text: "vel esse laudantium minima quisquam corrupti tenetur. Officiis, ipsa! Perspiciatis, libero distinctio! Lorem ipsum dolor sit amet consectetur",
    name: "Elyas Salar",
    position: "Frontend Developer",
    avatar: "https://avatars.githubusercontent.com/u/83926888?v=4",
  },
];

export const Carousel = ({ message }: { message: string }) => {
  const [isActive, setIsActive] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isActive) {
      const timeoutHandle = setTimeout(() => {
        setIsActive(true);
      }, 60_000 * 5);

      return () => clearTimeout(timeoutHandle);
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      const timeoutHandle = setInterval(() => {
        setCurrentIndex((oldIndex) => (oldIndex + 1) % TESTIMONIALS.length);
      }, 5000);

      return () => clearInterval(timeoutHandle);
    }
  }, [isActive]);

  return (
    <div className="p-6 hidden flex-col md:flex">
      <div className="bg-slate-100 flex flex-col items-start flex-1 rounded-lg p-16">
        <Icon height={40} />
        <div className="mt-20 max-w-lg">
          <h1 className="font-semibold text-3xl">
            Let's elevate your online security to the next level.
          </h1>
          <p className="mt-8 mb-8 text-slate-500">{message}</p>
        </div>
        <div className="mt-auto relative w-full h-[180px] overflow-hidden rounded-lg">
          {TESTIMONIALS.map(({ name, position, avatar, text }, i) => (
            <div
              key={i}
              className={classNames(
                "bg-slate-950/80 rounded-lg p-4 text-slate-100 max-w-lg left-0 right-0 mx-auto",
                "absolute duration-200 transition-all",
                {
                  "opacity-100 scale-x-100 delay-100": currentIndex === i,
                  "opacity-0 scale-x-75": currentIndex !== i,
                }
              )}
            >
              <p className="text-slate-100 text-sm">{text}</p>
              <div className="mt-6 flex items-center gap-2">
                <img className="w-8 h-8 rounded-full" src={avatar} alt={name} />
                <div className="">
                  <p className="text-xs font-medium tracking-wider">{name}</p>
                  <p className="text-xs text-slate-300">{position}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="absolute bottom-0 flex gap-2 items-center justify-center left-1/2 -translate-x-1/2">
            {TESTIMONIALS.map((_, i) => (
              <input
                type="radio"
                name="carousel"
                key={i}
                onClick={() => {
                  setCurrentIndex(i);
                  if (isActive) setIsActive(false);
                }}
                className={classNames(
                  "appearance-none w-3 h-3 rounded-full border-2 transition-all",
                  {
                    "bg-emerald-950 border-transparent cursor-auto": currentIndex === i,
                    "border-emerald-950 cursor-pointer": currentIndex !== i,
                  }
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
