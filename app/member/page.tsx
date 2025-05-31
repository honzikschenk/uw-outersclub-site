import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default async function MemberDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
          <Link href="/member" className="hover:underline">
            Member
          </Link>
        </nav>
        <Card className="p-8 text-center">
          <p className="mb-4">You must be signed in to view your dashboard.</p>
          <Link href="/sign-in" className="underline text-green-600">
            Sign in
          </Link>
        </Card>
      </div>
    );
  }

  // Fetch user membership status
  const { data: memberships, error: membershipError } = await supabase
    .from("Membership")
    .select("user_id, valid, admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    return (
      <div className="container mx-auto py-10">
        <div className="p-8 text-red-600">
          Error loading membership status: {membershipError.message}
        </div>
      </div>
    );
  }

  if (!memberships || !memberships.valid) {
    return (
      <div className="container mx-auto py-10">
        <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
          <Link href="/member" className="hover:underline">
            Member
          </Link>
        </nav>
        <Card className="p-8 text-center">
          <p className="mb-4">
            Your membership is not valid. Please renew your membership to access
            this page.
          </p>
          <Link href="/about" className="underline text-green-600">
            About Becoming a Member
          </Link>
        </Card>
      </div>
    );
  }

  // Fetch currently lent items for this user
  const { data: lentItems, error: lentError } = await supabase
    .from("Lent")
    .select("id, user_id, gear_id, lent_date, due_date")
    .eq("user_id", user.id)
    .order("due_date", { ascending: true });

  if (lentError) {
    return (
      <div className="container mx-auto py-10">
        <div className="p-8 text-red-600">
          Error loading lent items: {lentError.message}
        </div>
      </div>
    );
  }

  // If the user already has a lent item, fetch its gear name
  let gearName = "?";
  if (lentItems && lentItems.length > 0) {
    const { data: gear, error: gearError } = await supabase
      .from("Gear")
      .select("id, name")
      .eq("id", lentItems[0].gear_id)
      .single();
    if (gearError) {
      return (
        <div className="container mx-auto py-10">
          <div className="p-8 text-red-600">
            Error loading lent items: {gearError.message}
          </div>
        </div>
      );
    }
    gearName = gear.name;
  }

  return (
    <div className="container mx-auto py-10">
      <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
        <Link href="/member" className="hover:underline">
          Member
        </Link>
      </nav>
      <h1 className="text-4xl font-bold mb-8">My Lent Items</h1>
      {lentItems && lentItems.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <table className="min-w-full bg-white rounded">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-left">Lent Date</th>
                <th className="px-4 py-2 text-left">Due Date</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {lentItems.map((item: any) => {
                const due = item.due_date ? new Date(item.due_date) : null;
                const now = new Date();
                const isOverdue = due && due < now;
                return (
                  <tr key={item.id} className={isOverdue ? "bg-red-100" : ""}>
                    <td className="px-4 py-2 flex items-center gap-3">
                      <span>{gearName}</span>
                    </td>
                    <td className="px-4 py-2">
                      {item.lent_date
                        ? new Date(item.lent_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-2">
                      {due ? due.toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-2 font-semibold">
                      {isOverdue ? (
                        <span className="text-red-600">Past Due</span>
                      ) : (
                        "On Loan"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : (
        <p className="p-8 text-muted-foreground text-center">
          You have no items currently checked out.
        </p>
      )}
    </div>
  );
}
