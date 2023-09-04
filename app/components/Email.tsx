export const Email = ({ name, url }: { name: string; url: string }) => {
  return (
    <html lang="en">
      <body>
        <p>Welcome to Passkeys {name}</p>
        <p>
          Click 
          <a href={url}>Verify</a> to finish registering process.
        </p>
      </body>
    </html>
  );
};
