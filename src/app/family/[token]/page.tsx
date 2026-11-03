export default async function FamilyPage({ params }: { params: Promise<{ token: string }> }) { await params; return <main className="p-8"><h1 className="text-3xl">Family view</h1></main>; }
