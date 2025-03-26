import express from "express";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Async error handler
const asyncHandler = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

// User routes
const userRouter = express.Router();

userRouter.post("/", asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.create({ data: { username, password } });
  res.json(user);
}));

userRouter.put("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;
  const user = await prisma.user.update({ where: { id: Number(id) }, data: { username, password } });
  res.json(user);
}));

userRouter.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.delete({ where: { id: Number(id) } });
  res.json(user);
}));

userRouter.get("/", asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
}));

// Profile routes
const profileRouter = express.Router();

profileRouter.post("/", asyncHandler(async (req, res) => {
  const { email, name, address, phone, userId } = req.body;
  const profile = await prisma.profile.create({ data: { email, name, address, phone, userId } });
  res.json(profile);
}));

profileRouter.get("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const profile = await prisma.$queryRaw`SELECT * FROM "Profile" WHERE id = ${Number(id)}`;
  res.json(profile);
}));

// Post routes
const postRouter = express.Router();

postRouter.post("/", asyncHandler(async (req, res) => {
  const { title, content, published, authorId } = req.body;
  const post = await prisma.post.create({ data: { title, content, published, authorId } });
  res.json(post);
}));

postRouter.get("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const post = await prisma.post.findUnique({ where: { id: Number(id) } });
  res.json(post);
}));

postRouter.post("/insert", asyncHandler(async (req, res) => {
  const { title, content, published, authorId, categoryId, assignedBy } = req.body;

  const post = await prisma.$transaction(async (prisma) => {
    const createdPost = await prisma.post.create({ data: { title, content, published, authorId } });
    await prisma.categoriesOnPosts.create({ data: { postId: createdPost.id, categoryId, assignedBy } });
    return createdPost;
  });

  res.json(post);
}));

// Category routes
const categoryRouter = express.Router();

categoryRouter.post("/", asyncHandler(async (req, res) => {
  const { name } = req.body;
  const category = await prisma.category.create({ data: { name } });
  res.json(category);
}));

// Register routes
app.use("/user", userRouter);
app.use("/profile", profileRouter);
app.use("/post", postRouter);
app.use("/category", categoryRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
