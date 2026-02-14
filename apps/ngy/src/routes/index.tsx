const t = {
  hello: () => {
    "use server";
    console.log("hello");
  },
};

export default function Home() {
  return (
    <main>
      Hello<button onClick={() => t.hello()}>Test</button>
    </main>
  );
}
