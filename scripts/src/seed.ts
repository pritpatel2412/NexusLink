import { db } from "@workspace/db";
import { usersTable, contactsTable, contactTagsTable, interactionsTable, tasksTable, remindersTable } from "@workspace/db/schema";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

async function main() {
  console.log("🌱 Seeding NexusLink database...");

  // Delete in order
  await db.delete(remindersTable);
  await db.delete(tasksTable);
  await db.delete(interactionsTable);
  await db.delete(contactTagsTable);
  await db.delete(contactsTable);
  await db.delete(usersTable);

  // Create demo user
  const demoId = nanoid();
  const hashedPassword = await bcrypt.hash("demo1234", 12);
  await db.insert(usersTable).values({
    id: demoId,
    name: "Alex Demo",
    email: "demo@nexuslink.app",
    password: hashedPassword,
    plan: "pro",
    timezone: "America/New_York",
  });

  console.log("✅ Created demo user: demo@nexuslink.app / demo1234");

  // Seed contacts
  const contactData = [
    { name: "Sarah Chen", email: "sarah@vcfirm.com", phone: "+1-415-555-0101", company: "Sequoia Capital", role: "Partner", location: "San Francisco, CA", whereMet: "SaaStr 2024", tags: [{ tag: "investor", color: "#6C63FF" }, { tag: "warm-lead", color: "#FBBF24" }], notes: "Very interested in our B2B SaaS thesis. Wants to see Q2 metrics.", linkedinUrl: "https://linkedin.com/in/sarahchen" },
    { name: "Marcus Williams", email: "marcus@techcorp.io", phone: "+1-212-555-0102", company: "TechCorp", role: "CEO", location: "New York, NY", whereMet: "Twitter DM", tags: [{ tag: "client", color: "#34D399" }], notes: "Current enterprise client, paying $3k/mo. Expansion opportunity in Q3.", twitterUrl: "https://twitter.com/mwilliams" },
    { name: "Emma Rodriguez", email: "emma@designstudio.co", company: "Design Studio", role: "Creative Director", location: "Austin, TX", whereMet: "Figma Conference", tags: [{ tag: "collaborator", color: "#A78BFA" }], notes: "Potential design partner for our marketing rebrand." },
    { name: "James Liu", email: "james@foundation.org", phone: "+1-650-555-0104", company: "Founder's Foundation", role: "Program Director", location: "Palo Alto, CA", whereMet: "YC Demo Day", tags: [{ tag: "mentor", color: "#F87171" }], notes: "Amazing advisor on go-to-market. Met at YC." },
    { name: "Aisha Patel", email: "aisha@cloudstack.dev", company: "CloudStack", role: "CTO", location: "London, UK", whereMet: "Friend referral from Marcus", tags: [{ tag: "warm-lead", color: "#FBBF24" }, { tag: "collaborator", color: "#A78BFA" }], notes: "Building complementary infrastructure tooling. Exploring integration partnership.", introducedBy: "Marcus Williams" },
    { name: "Ryan Park", email: "ryan@growthsociety.com", phone: "+1-323-555-0106", company: "Growth Society", role: "Founder", location: "Los Angeles, CA", whereMet: "ProductHunt community", tags: [{ tag: "creator", color: "#C084FC" }], notes: "Has a 50k newsletter audience. Interested in partnership/affiliate." },
    { name: "Diana Foster", email: "diana@capitalventures.com", company: "Capital Ventures", role: "Associate", location: "Boston, MA", whereMet: "AngelList", tags: [{ tag: "investor", color: "#6C63FF" }], notes: "Junior VC at Capital Ventures. Passed our deck up to their partner." },
    { name: "Tom Nakamura", email: "tom@supplierhq.com", phone: "+1-408-555-0108", company: "SupplierHQ", role: "Business Development", location: "San Jose, CA", whereMet: "Slack community #startups", tags: [{ tag: "vendor", color: "#F87171" }], notes: "Provides white-label AI APIs. 30% discount offered if we commit to annual." },
    { name: "Lily Zhang", email: "lily@mediahouse.tv", company: "MediaHouse", role: "Content Director", location: "New York, NY", whereMet: "Twitter Spaces", tags: [{ tag: "creator", color: "#C084FC" }, { tag: "collaborator", color: "#A78BFA" }], notes: "Runs a popular tech podcast. Open to feature us in an episode." },
    { name: "Carlos Mendez", email: "carlos@buildfast.io", phone: "+1-512-555-0110", company: "BuildFast", role: "Founder & CEO", location: "Austin, TX", whereMet: "Indie Hackers meetup", tags: [{ tag: "friend", color: "#34D399" }, { tag: "collaborator", color: "#A78BFA" }], notes: "Great friend in the startup world. Building dev tools, different market." },
    { name: "Nina Blackwood", email: "nina@enterprise.co", phone: "+1-847-555-0111", company: "Enterprise Co", role: "VP of Sales", location: "Chicago, IL", whereMet: "LinkedIn outreach", tags: [{ tag: "client", color: "#34D399" }, { tag: "warm-lead", color: "#FBBF24" }], notes: "Very interested in team plan. Wants to onboard 5 sales reps." },
    { name: "George Hoffman", email: "george@advisornet.com", company: "AdvisorNet", role: "Strategic Advisor", location: "Denver, CO", whereMet: "Conference panel", tags: [{ tag: "mentor", color: "#F87171" }], notes: "Former SaaS founder (2 exits). Invaluable advice on pricing strategy." },
  ];

  const contacts: any[] = [];
  for (const data of contactData) {
    const id = nanoid();
    const { tags, ...rest } = data;
    await db.insert(contactsTable).values({ id, userId: demoId, ...rest });
    for (const tag of tags) {
      await db.insert(contactTagsTable).values({ id: nanoid(), contactId: id, tag: tag.tag, color: tag.color });
    }
    contacts.push({ id, name: data.name });
    console.log(`  ✅ Contact: ${data.name}`);
  }

  // Seed interactions
  const interactionData = [
    { contactIdx: 0, type: "meeting", summary: "Intro pitch meeting at Sequoia office. Walked through deck and demo. Sarah loved the retention metrics.", daysAgo: 5 },
    { contactIdx: 0, type: "email", summary: "Follow-up email sent with updated financial model and customer testimonials.", daysAgo: 3 },
    { contactIdx: 1, type: "call", summary: "Monthly check-in call. They're expanding usage to 2 more departments. Discussing enterprise upgrade.", daysAgo: 2 },
    { contactIdx: 1, type: "meeting", summary: "Onboarding kickoff meeting. Walked through advanced features and API integration.", daysAgo: 14 },
    { contactIdx: 2, type: "dm", summary: "DM conversation on Figma community. She shared her portfolio and we aligned on aesthetic direction.", daysAgo: 7 },
    { contactIdx: 2, type: "call", summary: "Discovery call to discuss rebrand project scope. Budget around $15k.", daysAgo: 3 },
    { contactIdx: 3, type: "meeting", summary: "Strategy session at his Palo Alto office. Discussed positioning against Salesforce.", daysAgo: 10 },
    { contactIdx: 3, type: "email", summary: "Sent thank you note and follow-up questions about enterprise GTM strategy.", daysAgo: 9 },
    { contactIdx: 4, type: "meeting", summary: "Video call about potential API integration. Tech stacks are compatible.", daysAgo: 4 },
    { contactIdx: 5, type: "dm", summary: "Twitter DM exchange about content collaboration. He wants to write a review post.", daysAgo: 6 },
    { contactIdx: 6, type: "email", summary: "Cold outreach response. She's reviewing our deck this week.", daysAgo: 1 },
    { contactIdx: 7, type: "call", summary: "Demo of their API. Impressive response times. Discussed custom pricing.", daysAgo: 8 },
    { contactIdx: 8, type: "meeting", summary: "Podcast pre-interview chat. Recording scheduled for next month.", daysAgo: 3 },
    { contactIdx: 9, type: "event", summary: "Met at Indie Hackers Austin meetup. Great conversation about bootstrapping.", daysAgo: 12 },
    { contactIdx: 10, type: "call", summary: "Sales call. She wants to run a 2-week pilot with her team before committing.", daysAgo: 1 },
    { contactIdx: 11, type: "meeting", summary: "Monthly advisor check-in. He recommended re-pricing our pro tier from $9 to $14.", daysAgo: 6 },
  ];

  for (const interaction of interactionData) {
    const contact = contacts[interaction.contactIdx];
    const occurredAt = new Date();
    occurredAt.setDate(occurredAt.getDate() - interaction.daysAgo);
    await db.insert(interactionsTable).values({
      id: nanoid(),
      contactId: contact.id,
      userId: demoId,
      type: interaction.type,
      summary: interaction.summary,
      source: "manual",
      occurredAt,
    });
  }

  console.log("✅ Created interactions");

  // Seed tasks
  const taskData = [
    { contactIdx: 0, title: "Send updated investor deck with new ARR numbers", priority: "high", daysFromNow: 0 },
    { contactIdx: 1, title: "Prepare enterprise upgrade proposal for Marcus", priority: "high", daysFromNow: 2 },
    { contactIdx: 2, title: "Send design brief and project requirements to Emma", priority: "medium", daysFromNow: 3 },
    { contactIdx: 4, title: "Schedule technical integration call with Aisha's dev team", priority: "medium", daysFromNow: 5 },
    { contactIdx: 5, title: "Draft content collaboration agreement for Ryan", priority: "medium", daysFromNow: 7 },
    { contactIdx: 6, title: "Follow up with Diana — check if deck reached the partner", priority: "low", daysFromNow: 2 },
    { contactIdx: 10, title: "Set up pilot account for Nina's team", priority: "high", daysFromNow: 1 },
    { contactIdx: 3, title: "Read book James recommended: 'Crossing the Chasm'", priority: "low", daysFromNow: 14 },
  ];

  for (const task of taskData) {
    const contact = contacts[task.contactIdx];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + task.daysFromNow);
    await db.insert(tasksTable).values({
      id: nanoid(),
      userId: demoId,
      contactId: contact.id,
      title: task.title,
      priority: task.priority,
      status: "pending",
      dueDate,
    });
  }

  console.log("✅ Created tasks");

  // Seed reminders
  const reminderData = [
    { contactIdx: 0, message: "Check in with Sarah Chen before our next investor meeting", daysFromNow: 2 },
    { contactIdx: 1, message: "Follow up with Marcus about enterprise plan decision", daysFromNow: 3 },
    { contactIdx: 10, message: "Nina's pilot period ends — discuss full subscription", daysFromNow: 14 },
    { contactIdx: 4, message: "Aisha expected to share integration technical requirements", daysFromNow: 7 },
  ];

  for (const reminder of reminderData) {
    const contact = contacts[reminder.contactIdx];
    const remindAt = new Date();
    remindAt.setDate(remindAt.getDate() + reminder.daysFromNow);
    await db.insert(remindersTable).values({
      id: nanoid(),
      userId: demoId,
      contactId: contact.id,
      message: reminder.message,
      remindAt,
      sent: false,
    });
  }

  console.log("✅ Created reminders");
  console.log("\n🎉 Seeding complete!");
  console.log("📧 Demo login: demo@nexuslink.app / demo1234");
}

main().catch(console.error).finally(() => process.exit(0));
