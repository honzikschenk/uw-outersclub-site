"use client";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function RentingTermsDialog() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
  }, []);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="link" className="px-2">
          Renting Terms & Conditions
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Renting Terms & Conditions</AlertDialogTitle>
          <h3>Prerequisites</h3>
          <ul className="list-disc pl-5">
            <li>Must have an Outers Club Membership.</li>
            <li>
              Current student, or have a UWaterloo Athletics membership if you
              are on a co-op term.
            </li>
          </ul>
          <h3 className="mt-4">How to Rent</h3>
          <ol className="list-decimal pl-5">
            <li>
              Reserve and check out the equipment at our equipment room during
              office hours (5:30-6:30 pm Tuesdays and Thursdays).
            </li>
            <li>
              Pay the rental rate for the specified number of days at the PAC
              front desk (must be done only after equipment has been reserved).
            </li>
            <li>
              Immediately check the equipment for completeness and damage. You
              will be held responsible for any missing or damaged parts reported
              later.
            </li>
            <li>
              Return the equipment during designated equipment room hours.
              Equipment must be returned clean and dry. If you rented a first
              aid kit, inform us of any used items so that we can restock it for
              the next renter. We do not charge for items used from first aid
              kits.
            </li>
          </ol>
          <h3 className="mt-4">Rental Policies</h3>
          <ul className="list-disc pl-5">
            <li>
              Members may only rent one of each item; for example, one tent per
              member, one canoe per member, etc.
            </li>
            <li>
              Reservations can be made in advance using our online
              site. Reservations will be honoured to the limit of the Club
              abilities; please note that factors beyond the Club's control may
              affect the availability of reserved equipment. For example, the
              equipment may not have been returned on time by a previous renter.
            </li>
            <li>
              Please show up to the PAC 2010 equipment room during equipment
              room hours to pay for and pick up equipment. You must have a valid
              Athletics membership in order to tap in with your WatCard to
              access the PAC.
            </li>
            <li>
              No deposit is required, but members will be held responsible for
              paying the replacement cost of any equipment not returned.
              Equipment not returned will result in suspension from all UW
              facilities until equipment is returned or the replacement cost is
              covered.
            </li>
            <li>
              Only equipment in good condition will be accepted for return.
              Equipment that is damaged beyond normal wear and tear must be
              repaired before return, or the cost of repair be covered prior to
              its return.
            </li>
            <li>Equipment may be rented out during end-of-term breaks.</li>
            <li>
              Members are requested to inform the rental volunteer what
              first-aid kit items have been used. There is no charge for
              consuming stock; this is so we can ensure the next person renting
              has a fully replenished kit for their safety.
            </li>
          </ul>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setOpen(false)}>
            I accept
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
