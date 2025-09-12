import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Term, MembershipFee } from "@/utils/global-variables";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata = {
  title: "About | UW Outers Club",
};

export default async function About() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 space-y-12">
      <section id="about-us">
        <h1 className="text-3xl font-bold mb-4">About the Outers Club</h1>
        <p>
          We're a community of outdoor enthusiasts who focus on activities throughout all 4 seasons.
          When it's warm we enjoy camping, hiking, canoeing, climbing, cycling, slacklining, and a
          whole lot more. When it's nice and snowy, we go winter camping, snowshoeing, and
          cross-country skiing until it warms up again. Our members have been doing this for over 40
          years!
          <br />
          <br />
          The per term membership fee provides you with access to all our shared resources:
        </p>
        <ul className="list-disc list-inside ml-6">
          <li>low-cost equipment rentals,</li>
          <li>extensive books and maps library,</li>
          <li>participation on trips and at social gatherings.</li>
        </ul>
        <br />
        <p>
          We are ALL volunteers. We like to encourage everyone to participate in the organization of
          club events. Please contact our helpful executive team for more information, assistance,
          or any comments/suggestions.
        </p>
      </section>
      <section id="become-a-member">
        <h2 className="text-2xl font-semibold mb-4 mt-8">Become a Member</h2>
        <p>
          Memberships are on a per term basis. Membership for {Term} is ${MembershipFee} for the
          term.
          <br />
          <br />
          The benefits of becoming a member:
        </p>
        <ul className="list-disc list-inside ml-6">
          <li>low-cost equipment rentals,</li>
          <li>extensive books and maps library,</li>
          <li>participation on trips and at social gatherings.</li>
        </ul>
        <br />
        <h2 className="text-xl font-semibold mb-2 mt-4">How to become a member:</h2>
        <ol className="list-decimal list-inside ml-6">
          <li>
            Sign up for the Outers Club membership on the UW Athletics and Recreation website
            <ul className="list-disc list-inside ml-6">
              <li>
                Go to{" "}
                <a
                  className="text-green-500 hover:text-green-700 underline"
                  href="https://warrior.uwaterloo.ca/Program/GetProgramDetails?courseId=61b7af94-85b6-46c8-818c-d1daa59bfc97"
                >
                  UW Athletics and Recreation - Outers Club Product page
                </a>
                . If the link doesn't work, go{" "}
                <a
                  className="text-green-500 hover:text-green-700 underline"
                  href="https://warrior.uwaterloo.ca/"
                >
                  here
                </a>{" "}
                and click "Club Memberships", then "Outers Club"
              </li>
              <li>Click on "Sign In" in the top right corner</li>
              <li>Log in with your UW credentials</li>
              <li>Click "SELECT"</li>
            </ul>
          </li>
          <li>
            Join the{" "}
            <a
              className="text-green-500 hover:text-green-700 underline"
              href="https://discord.com/invite/hPCUhxt7f7"
            >
              UW Outers Club Discord
            </a>{" "}
            and follow us on{" "}
            <a
              className="text-green-500 hover:text-green-700 underline"
              href="https://www.instagram.com/wloo.outersclub?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
            >
              Instagram
            </a>{" "}
            to stay up-to-date on announcements and events.
          </li>
          <li>Click the button below to register to rent gear</li>
        </ol>
        <Button className="mt-4" variant="outline">
          <a href="/sign-up">Sign Up</a>
        </Button>
      </section>
      <section id="get-involved">
        <h2 className="text-2xl font-semibold mb-4 mt-8">Get More Involved</h2>
        <p>
          Want to help out? We’re always looking for volunteers to help organize trips, lead events,
          or contribute to our club’s operations. Reach out to us at our meetings or contact us{" "}
          <a className="text-green-500 hover:text-green-700 underline" href="/contact">
            here
          </a>{" "}
          to learn more about how you can get involved.
        </p>
        <h2 className="text-xl font-semibold mb-2 mt-4">Organize a Trip</h2>
        <p>
          Trips can vary from short day hikes to longer, week long canoeing trips. Organizing a trip
          is a great way to gain some leadership experience.
        </p>
        <h2 className="text-xl font-semibold mb-2 mt-4">Volunteer</h2>
        <p>
          The club could not run without our volunteers. All volunteers get free rentals! Some
          things you can help with as a volunteer:
        </p>
        <ul className="list-disc list-inside ml-6">
          <li>equipment rentals during the office hours,</li>
          <li>equipment repairs,</li>
          <li>social events (weekly meetings, instructional sessions, …),</li>
          <li>social outreach (advertising, newsletter, trip summaries, …),</li>
          <li>website.</li>
        </ul>
        <h2 className="text-xl font-semibold mb-2 mt-4">Become an Executive</h2>
        <p>
          As an executive you can take an active role in shaping the future of the club. Executives
          are usually recruited from members who have been volunteering for at least a term.
        </p>
      </section>
      <section id="our-executives">
        <h2 className="text-2xl font-semibold mb-4 mt-8">Our Executives</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex flex-col items-center">
            <Avatar className="w-32 h-32">
              <AvatarImage src="/execs/hannah.jpg" />
              <AvatarFallback>HN</AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-semibold mt-2">Hannah</h3>
          </div>

          <div className="flex flex-col items-center">
            <Avatar className="w-32 h-32">
              <AvatarImage src="/execs/kat.jpg" />
              <AvatarFallback>KT</AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-semibold mt-2">Kat</h3>
          </div>

          <div className="flex flex-col items-center">
            <Avatar className="w-32 h-32">
              <AvatarImage src="/execs/devon.jpg" />
              <AvatarFallback>DV</AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-semibold mt-2">Devon</h3>
          </div>

          <div className="flex flex-col items-center">
            <Avatar className="w-32 h-32">
              <AvatarImage src="/execs/kyle.jpg" />
              <AvatarFallback>KL</AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-semibold mt-2">Kyle</h3>
          </div>

          <div className="flex flex-col items-center">
            <Avatar className="w-32 h-32">
              <AvatarImage src="/execs/lakshya.jpg" />
              <AvatarFallback>LK</AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-semibold mt-2">Lakshya</h3>
          </div>

          <div className="flex flex-col items-center">
            <Avatar className="w-32 h-32">
              <AvatarImage src="/execs/aeron.jpg" />
              <AvatarFallback>AR</AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-semibold mt-2">Aeron</h3>
          </div>

          <div className="flex flex-col items-center">
            <Avatar className="w-32 h-32">
              <AvatarImage src="/" />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-semibold mt-2">You?</h3>
          </div>
        </div>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Past Execs</AccordionTrigger>
            <AccordionContent>
              Thanks to student visionaries, the Outers Club has been a successful club since the
              early 1970s. Our special thanks goes to all the volunteers who have contributed to
              this great club throughout the years. The following is only a growing list of people
              who have spent time and effort to make the Outers Club such a unique and friendly
              place that it is today. We like to hear from every one of our people, they are part of
              the Club's past, present, and inspiration for future volunteers.
              <br />
              <br />
              <ul className="list-disc list-inside ml-6">
                <li>Tim Hill</li>
                <li>Claire Parrott</li>
                <li>Evan Takefman</li>
                <li>Roohen Tarighat</li>
                <li>Christian Barna; President, Co-Leader. 2016-2020</li>
                <li>Micaela Yawney; Co-Leader. 2017-2020</li>
                <li>Peter Tao; Executive, equipment room. 2017-2018</li>
                <li>
                  Jan Gosmann; Executive, bouldering clinics, equipment room. 2014–2018. Jan moved
                  to Munich, Germany and continues to enjoy the outdoors in the Alps.
                </li>
                <li>Elif Tuzlalı; Executive, equipment room. 2017–2018</li>
                <li>Chris Garland; Executive, equipment room, trip leader. 2011-2017.</li>
                <li>Amir Panahi; Executive, equipment room, trip leader. 2014-2017.</li>
                <li>Veronica Taylor; Executive, equipment room, trip leader. 2013-2017.</li>
                <li>Rob Reid; Executive, equipment room. 2014-2017.</li>
                <li>Annalisa Mazzorato; Executive, equipment room, trip leader. 2012-2017.</li>
                <li>Karolina Kukulski; Executive, equipment room. 2013-2015.</li>
                <li>Mary Coulas; Executive, equipment room. 2014-2015.</li>
                <li>Ali Rabanni; Executive, equipment room, trip leader. 2013-2016.</li>
                <li>Sarah Rogalla; Executive, equipment room, social. 2009-2015.</li>
                <li>Xavier Perez; Executive, equipment room, social. 2009-2015.​</li>
                <li>Nicolas Gillis; Executive, equipment room. 2012-2014.</li>
                <li>Rajat Mittal, Executive, equipment room. 2011-2014.</li>
                <li>Laura Mančinska; Executive, equipment room, social. 2009-2014.</li>
                <li>
                  Yelda Turkan Equipment room person, 2009-2012. Yelda lives in Ames Iowa, the corn
                  country.
                </li>
                <li>
                  Koorus Bookan Treasurer, equipment room, social, 1990-2011. Koorus lives in
                  Waterloo.
                </li>
                <li>
                  Luiz Celso Gomes Equipment room, 2008-2010. Luiz is travelling in South America
                </li>
                <li>
                  Brett Hamilton , Equipment room, Hiking, 2003-2008, Brett is starting his graduate
                  studies in U of Calgary this Fall. Last seen in northern Manitoba.
                </li>
                <li>
                  Stefan Buettcher Equipment room, 2004-2007, Stefan is travelling this summer
                  before start working at Google.
                </li>
                <li>
                  Aurelie Labbe, Equipment room and president, 2001-2004. Aurlie lives in Quebec
                  city.
                </li>
                <li>Jennifer Chen, Equipment room, 1999-2002, Jennifer lives in Calgary.</li>
                <li>
                  Darren Cope, Equipment room, 1999-2002, Darren lives in Ontario somewhere
                  nearby...
                </li>
                <li>
                  Craig Howthorne, equipment room, president, 1997-2002. Craig was last seen in
                  Germany.
                </li>
                <li>
                  Neil DeBoni, chair person, various positions, 1998-2000. Neil works in Calgary
                  area.
                </li>
                <li>Bill Rosehart, Newsletter, 1998-2001. Bill works at university of Calgary.</li>
                <li>
                  Eve Bezaire Dussault, bouldering wall, president, 1997-2000. Eve last was seen in
                  southern Ontario:)
                </li>
                <li>
                  Morven Duncan, 1995-2000, President and equipment room person. Morven lives in
                  Scotland.
                </li>
                <li>
                  David Kidston, membership, and president, 1997-1998, Dave is living in Ottawa
                </li>
                <li>
                  Karsten Verbeurgt, president, trail, and bouldering wall, 1992-1998, Karsten is
                  living in Calgary.
                </li>
                <li>David Neuhamsie(?),Equipment room, 1997-1998. David is back to Switzerland.</li>
                <li>Trish Unger, hiking, president, 1995-1998. Trish lives in Waterloo.</li>
                <li>Dan Currie, Ski Trails person, 1996-1997, Dan lives in Waterloo</li>
                <li>
                  James Taylor, Kayaking, 1995-1997, James traveled to Nepal, and was last seen in
                  Toronto.
                </li>
                <li>Kyle McKenzie Newsletter editor and president, 1993-1997.</li>
                <li>
                  Yann Roth, Equipment room person. 1996-1997. Yann successfully cycled to Inuvik
                  and back. He was last seen in Switzerland
                </li>
                <li>
                  Stefanie Hackel , Secretry.1996-1997, Stefanie finished her studies and is living
                  in Germany(?).
                </li>
                <li>Soeren Peik, Social.1995-1996, Soeren is living in Germany.</li>
                <li>Gudrun Wessel, Memebership person.1992-1996, Gudrun is living in Germany.</li>
                <li>
                  Fabrice Jaubert, Equipment room person.1992-1996, Fabrice is living in Montreal.
                </li>
                <li>Daniela Hermann Secretry. 1994-1995, Daniela is living Germany</li>
                <li>Joanne Pushkarenko(?), Secretry, 1994-1996. Joanne works in Markham(?).</li>
                <li>Stewart McIlwain,President. 1995-1996, Stewart is working in Ottawa..</li>
                <li>Eric Davis, Treasurer. 1993-1994, Eric is living in BC.</li>
                <li>
                  Lutz Nuecker, Newsletter.1994-1995, Lutz is finishing his studies in Germany.
                </li>
                <li>Marie Lagimodier, co-president,1992-1993, Marie moved to Saskatchewan(?).</li>
                <li>Nora Sleumer President, 1992-1993,Nora is living in Switzerland.</li>
                <li>Eric Praetzel, Treasurer. 1992-1993, Eric is living in Waterloo.</li>
                <li>
                  Andrew Mylly, 1991-1994 Andrew lives in Vancouver and works for federal
                  government. Andrew still is involved in canoeing and kayaking.
                </li>
                <li>Chris Kennedy, President.1990-1991, Chris is teaching at U of T.</li>
                <li>Sharon Regan, President.1989-1991, Sharon is working in northern Ontario.</li>
                <li>
                  ​Greg Derbyshire. 1974-1977, Founder and the first president of Outers Club.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
      <section id="constitution">
        <h2 className="text-2xl font-semibold mb-4 mt-8">Constitution</h2>
        <iframe
          src="https://docs.google.com/document/d/1v-izxgRNtpqtW6ORSPoFKaaEmjEleKY4NXjlizxOGW4/preview"
          title="UW Outers Club Constitution Document"
          width="100%"
          height="600"
          allow="autoplay"
        />
      </section>
    </main>
  );
}
