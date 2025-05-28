import Image from 'next/image'

export default function Contact() {
  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
        <span className="hover:underline">Contact</span>
      </nav>
      <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
      <section className="mb-10">
        <ul className="list-disc list-inside ml-6 space-y-2 text-lg">
          <li>
            Email: <a className="text-green-600 underline" href="mailto:outersclub.uwaterloo@gmail.com">outersclub.uwaterloo@gmail.com</a>
          </li>
          <li>
            In person during our <a className="text-green-600 underline" href="/resources">equipment room hours</a>
          </li>
          <li>
            Join our Discord: <a className="text-green-600 underline" href="https://discord.com/invite/hPCUhxt7f7" target="_blank" rel="noopener noreferrer">UW Outers Club Discord</a>
          </li>
          <li>
            Our Instagram: <a className="text-green-600 underline" href="https://www.instagram.com/wloo.outersclub" target="_blank" rel="noopener noreferrer">@wloo.outersclub</a>
          </li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-4 mt-8">Our office</h2>
        <p className="mb-4 text-lg">We are located in PAC 2010 (west).</p>
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="w-full md:w-1/2 flex flex-col items-center">
            <Image src="/room-map.png" alt="PAC 2010 map and location" width={800} height={500} className="rounded shadow border" />
            <span className="text-sm text-muted-foreground mt-2">Office location and map</span>
          </div>
          <div className="w-full md:w-1/2">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m13!1m8!1m3!1d4034.0179440096254!2d-80.546354!3d43.472190000000005!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zNDPCsDI4JzE5LjciTiA4MMKwMzInNDcuNSJX!5e1!3m2!1sen!2sus!4v1746908790753!5m2!1sen!2sus"
              width="100%"
              height="350"
              title="PAC 2010 location on Google Maps"
              className="rounded shadow border"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  )
}
