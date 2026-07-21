type AvatarProps = {
  className?: string;
  title?: string;
};

export default function Avatar02({
  className = "h-full w-full",
  title = "Avatar 02",
}: AvatarProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>

      <circle
        cx="256"
        cy="256"
        r="248"
        fill="#18181b"
        stroke="#ef4444"
        strokeWidth="8"
      />

      <circle
        cx="256"
        cy="210"
        r="90"
        fill="#3f3f46"
      />

      <path
        d="M100 500C110 390 170 340 256 340C342 340 402 390 412 500Z"
        fill="#27272a"
      />

      <text
        x="256"
        y="280"
        textAnchor="middle"
        fill="#ef4444"
        fontSize="90"
        fontWeight="800"
        fontFamily="Arial, sans-serif"
      >
        02
      </text>
    </svg>
  );
}