}

export async function updateFinancialSettings(data: Partial<InsertFinancialSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getFinancialSettings();
  if (existing) {
    return await db.update(financialSettings).set(data).where(eq(financialSettings.id, existing.id));
  } else {
    return await db.insert(financialSettings).values(data as any);
  }
}

export async function updateUserVip(userId: number, data: { vipScore: number, vipTier: any, lifetimeSpend: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(users).set(data).where(eq(users.id, userId));
}

/**