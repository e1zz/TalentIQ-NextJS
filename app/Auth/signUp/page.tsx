
import SignIn from "@/components/SignIn";

export default function Home() {
    return (
      <section className='flex flex-row'>
        <div className='container'>
            <SignIn/>
        </div>
        <div className="wallpaper">
        <img></img>
        </div>
      </section>
    )
  }
  