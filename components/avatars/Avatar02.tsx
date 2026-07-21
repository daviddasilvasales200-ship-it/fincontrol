type Avatar02Props = {
  className?: string;
  title?: string;
};

export default function Avatar02({
  className = "h-full w-full",
  title = "Avatar 02",
}: Avatar02Props) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-full bg-black ${className}`}
      role="img"
      aria-label={title}
      title={title}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/avatars/avatar02.png"
        alt={title}
        className="h-full w-full object-cover object-center"
      />

      <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-red-500" />

      <div className="pointer-events-none absolute inset-[4px] rounded-full border border-white/10" />
    </div>
  );
}