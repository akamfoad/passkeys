export const Icon = ({ height = 32 }: { height?: number }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" height={height} viewBox="0 0 24 24">
      <circle fill="currentColor" cx="10.5" cy="6" r="4.5" />
      <path
        fill="currentColor"
        d="M22.5 10.5a3.5 3.5 0 1 0-5 3.15V19l1.5 1.5 2.5-2.5-1.5-1.5 1.5-1.5-1.24-1.24a3.5 3.5 0 0 0 2.24-3.26zm-3.5 0a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm-4.56 2.02A6 6 0 0 0 12 12H9a6 6 0 0 0-6 6v2h13v-5.51a5.16 5.16 0 0 1-1.56-1.97z"
      />
    </svg>
  );
};
