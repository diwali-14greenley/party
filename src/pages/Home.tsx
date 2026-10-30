import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Home() {
  const { session } = useAuth();

  return (
    <main className="page">
      <section className="hero">
        <div className="hero-confetti" aria-hidden>🎉 🥂 🎈 🪩 🎂</div>
        <h1>
          Throw the party.
          <br />
          <span className="accent">We'll count the heads.</span>
        </h1>
        <p className="lead">
          Make an event page in a minute, share one link, and watch RSVPs roll in live.
        </p>
        <div className="row gap">
          <Link to={session ? '/host' : '/login'} className="btn btn-primary btn-lg">
            {session ? 'Go to my events' : 'Host a party'}
          </Link>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <span className="feature-icon">🔗</span>
          <h3>One link</h3>
          <p>Guests RSVP from any phone. No account, no app download.</p>
        </div>
        <div className="feature">
          <span className="feature-icon">⚡</span>
          <h3>Live list</h3>
          <p>Your dashboard updates the second someone says yes.</p>
        </div>
        <div className="feature">
          <span className="feature-icon">📋</span>
          <h3>Export</h3>
          <p>Download the guest list as a CSV for the caterer.</p>
        </div>
      </section>
    </main>
  );
}
