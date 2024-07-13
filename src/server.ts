import fastity from "fastify";

const app = fastity();

app.get("/", () => {
  return { message: "Hello World" };
});

app
  .listen({
    port: 3444,
  })
  .then(() => {
    console.log("🚀 Server running on port:", 3444);
  });
