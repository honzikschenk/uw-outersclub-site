import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function MemberDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p>You must be signed in to view your dashboard.</p>
        <Link href="/sign-in" className="underline text-green-600">Sign in</Link>
      </div>
    )
  }

  // Fetch currently lent items for this user
  const { data: lentItems, error } = await supabase
    .from('Lent')
    .select('id, gear_id, lent_date, due_date, returned_date, Gear(name, image_url)')
    .eq('user_id', user.id)
    .is('returned_date', null)
    .order('due_date', { ascending: true })

  if (error) {
    return <div className="p-8 text-red-600">Error loading lent items: {error.message}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">My Lent Items</h1>
      {lentItems && lentItems.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
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
                const due = item.due_date ? new Date(item.due_date) : null
                const now = new Date()
                const isOverdue = due && due < now
                return (
                  <tr key={item.id} className={isOverdue ? 'bg-red-100' : ''}>
                    <td className="px-4 py-2 flex items-center gap-3">
                      {item.Gear?.image_url && (
                        <img src={item.Gear.image_url} alt={item.Gear.name} className="w-12 h-12 object-cover rounded" />
                      )}
                      <span>{item.Gear?.name || item.gear_id}</span>
                    </td>
                    <td className="px-4 py-2">{item.lent_date ? new Date(item.lent_date).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-2">{due ? due.toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-2 font-semibold">
                      {isOverdue ? <span className="text-red-600">Past Due</span> : 'On Loan'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-muted-foreground">You have no items currently checked out.</div>
      )}
    </div>
  )
}