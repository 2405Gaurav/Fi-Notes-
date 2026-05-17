import "dotenv/config";
import prisma from "../lib/prisma.js";
import { hashPassword } from "../utils/index.js";

/**
 * Seed script — creates 3 test users with notes for each.
 *
 * Run:  npx tsx src/scripts/seed.ts
 *
 * Users:
 *   1. alice@test.com   / password123
 *   2. bob@test.com     / password123
 *   3. charlie@test.com / password123
 */

interface SeedUser {
  name: string;
  email: string;
  password: string;
  notes: { title: string; content: string; isPinned?: boolean; isArchived?: boolean }[];
}

const seedData: SeedUser[] = [
  {
    name: "Alice Johnson",
    email: "alice@test.com",
    password: "password123",
    notes: [
      {
        title: "Project Roadmap Q3",
        content:
          "1. Finalize API endpoints\n2. Build frontend components\n3. Integration testing\n4. Deploy to production\n5. User acceptance testing",
        isPinned: true,
      },
      {
        title: "Meeting Notes — Sprint Review",
        content:
          "Discussed progress on the notes app. Backend is 100% complete. Frontend needs NoteComposer and ShareModal. Target: end of sprint.",
      },
      {
        title: "Grocery List",
        content:
          "Milk, eggs, bread, butter, tomatoes, onions, garlic, olive oil, pasta, cheese, chicken breast",
      },
      {
        title: "Book Recommendations",
        content:
          "1. Clean Code — Robert C. Martin\n2. Designing Data-Intensive Applications — Martin Kleppmann\n3. The Pragmatic Programmer — Andy Hunt\n4. System Design Interview — Alex Xu",
        isPinned: true,
      },
      {
        title: "Workout Routine",
        content:
          "Monday: Chest + Triceps\nTuesday: Back + Biceps\nWednesday: Rest\nThursday: Legs + Shoulders\nFriday: Full body\nSaturday: Cardio\nSunday: Rest",
      },
    ],
  },
  {
    name: "Bob Smith",
    email: "bob@test.com",
    password: "password123",
    notes: [
      {
        title: "API Documentation Checklist",
        content:
          "- [ ] Auth endpoints documented\n- [ ] Notes CRUD documented\n- [ ] Share endpoint documented\n- [ ] Search endpoint documented\n- [ ] Error responses standardized",
        isPinned: true,
      },
      {
        title: "Learning TypeScript",
        content:
          "Key concepts to master:\n• Generics\n• Type guards\n• Utility types (Partial, Pick, Omit)\n• Conditional types\n• Mapped types\n• Template literal types",
      },
      {
        title: "Recipe: Pasta Carbonara",
        content:
          "Ingredients: Spaghetti, eggs (3), pecorino romano, guanciale, black pepper.\n\nSteps:\n1. Cook pasta al dente\n2. Crisp guanciale in pan\n3. Mix eggs + cheese in bowl\n4. Toss hot pasta with guanciale\n5. Remove from heat, add egg mixture\n6. Toss vigorously, season with pepper",
      },
      {
        title: "Weekend Plans",
        content:
          "Saturday:\n- Morning run at 7am\n- Brunch with team at 11am\n- Code review in afternoon\n\nSunday:\n- Sleep in\n- Read\n- Prep meals for the week",
        isArchived: true,
      },
    ],
  },
  {
    name: "Charlie Davis",
    email: "charlie@test.com",
    password: "password123",
    notes: [
      {
        title: "Database Design Notes",
        content:
          "Tables needed:\n• User — id, name, email, password\n• Note — id, title, content, ownerId\n• SharedNote — noteId, sharedWithUserId, permission\n• NoteVersion — noteId, version, title, content\n\nIndexes on: email (unique), ownerId, noteId+sharedWithUserId (compound unique)",
        isPinned: true,
      },
      {
        title: "Docker Commands Cheatsheet",
        content:
          "docker build -t app .\ndocker run -p 3000:3000 app\ndocker compose up -d\ndocker compose down\ndocker logs -f container_name\ndocker exec -it container_name sh\ndocker system prune -a",
      },
      {
        title: "Ideas for Side Projects",
        content:
          "1. CLI tool for managing dotfiles\n2. Real-time collaborative whiteboard\n3. Markdown blog engine with Git-based CMS\n4. Budget tracker with bank API integration\n5. AI-powered code reviewer",
      },
      {
        title: "Conference Talk Outline",
        content:
          "Title: Building Production-Grade APIs with Express + Prisma\n\nSections:\n1. Why Prisma over raw SQL?\n2. Schema design patterns\n3. Error handling middleware\n4. Authentication with JWT\n5. Testing strategies\n6. Deployment on Railway/Render",
        isPinned: true,
      },
      {
        title: "Archived: Old Project Notes",
        content:
          "This was from the previous version of the project. Keeping for reference but no longer actively needed.",
        isArchived: true,
      },
      {
        title: "Daily Standup Template",
        content:
          "Yesterday:\n- \n\nToday:\n- \n\nBlockers:\n- ",
      },
    ],
  },
];

async function seed() {
  console.log("🌱 Starting seed...\n");

  for (const userData of seedData) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existing) {
      console.log(`⏭  User ${userData.email} already exists — skipping`);
      continue;
    }

    // Create user
    const hashedPassword = await hashPassword(userData.password);
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
      },
    });

    console.log(`✓ Created user: ${user.name} (${user.email})`);

    // Create notes
    for (const noteData of userData.notes) {
      await prisma.note.create({
        data: {
          title: noteData.title,
          content: noteData.content,
          isPinned: noteData.isPinned ?? false,
          isArchived: noteData.isArchived ?? false,
          ownerId: user.id,
        },
      });
    }

    console.log(`  → Created ${userData.notes.length} notes`);
  }

  // Create a shared note: Alice shares her "Project Roadmap" with Bob
  const alice = await prisma.user.findUnique({ where: { email: "alice@test.com" } });
  const bob = await prisma.user.findUnique({ where: { email: "bob@test.com" } });

  if (alice && bob) {
    const roadmapNote = await prisma.note.findFirst({
      where: { ownerId: alice.id, title: "Project Roadmap Q3" },
    });

    if (roadmapNote) {
      const existingShare = await prisma.sharedNote.findUnique({
        where: {
          noteId_sharedWithUserId: {
            noteId: roadmapNote.id,
            sharedWithUserId: bob.id,
          },
        },
      });

      if (!existingShare) {
        await prisma.sharedNote.create({
          data: {
            noteId: roadmapNote.id,
            sharedWithUserId: bob.id,
          },
        });
        console.log(`\n✓ Shared "Project Roadmap Q3" from Alice → Bob`);
      }
    }
  }

  console.log("\n✅ Seed complete!\n");
  console.log("Test credentials (all use password: password123):");
  console.log("  • alice@test.com");
  console.log("  • bob@test.com");
  console.log("  • charlie@test.com");
}

seed()
  .catch((err) => {
    console.error("✗ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
