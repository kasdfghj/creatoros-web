import { ArrowRight, CheckCircle2, Compass, FolderKanban, MessageSquareText, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { CreatorCard, ProjectCard } from '../components/Cards'
import { useCommunity } from '../context/CommunityContext'

export function LandingPage() {
  const { profiles, projects } = useCommunity()
  return <div className="public-site">
    <header className="public-header"><Brand /><nav><a href="#how">How it works</a><a href="#community">Community</a><a href="#safety">Safety</a></nav><div className="public-actions"><Link className="button button-outline" to="/login">Sign in</Link><Link className="button" to="/login">Join CreatorOS</Link></div></header>
    <main>
      <section className="hero-section">
        <div className="hero-glow" />
        <div className="hero-copy"><span className="eyebrow"><Sparkles size={15} /> The professional community for independent creators</span><h1>Build more.<br /><em>Create together.</em></h1><p>CreatorOS combines a creator network, project workspace, collaboration board, and community feed in one browser-based platform.</p><div className="hero-actions"><Link className="button large" to="/login">Create your free account <ArrowRight size={18} /></Link><Link className="button button-outline large" to="/login?demo=1">Explore the demo</Link></div><div className="hero-proof"><span><CheckCircle2 size={16} /> No download required</span><span><CheckCircle2 size={16} /> Built for real projects</span><span><CheckCircle2 size={16} /> Free founding beta</span></div></div>
        <div className="hero-product"><div className="browser-frame"><div className="browser-bar"><span /><span /><span /><b>app.creatoros.community</b></div><div className="browser-app"><aside><div className="mini-logo">C</div>{['Home','Feed','Projects','Discover','Collaborate'].map((item,index)=><span className={index===0?'selected':''} key={item}>{item}</span>)}</aside><div className="browser-content"><div className="preview-heading"><div><small>GOOD AFTERNOON</small><h3>Keep the work moving.</h3></div><button>+ Create</button></div><div className="preview-stats"><span><b>4</b><small>Active projects</small></span><span><b>12</b><small>Creator matches</small></span><span><b>3</b><small>Open roles</small></span></div><div className="preview-columns"><div className="preview-panel"><strong>Community feed</strong><i /><i /><i /></div><div className="preview-panel narrow"><strong>Next milestone</strong><div className="preview-progress"><span /></div><b>Finish the first cut</b></div></div></div></div></div></div>
      </section>

      <section className="public-section feature-strip" id="how"><div><FolderKanban /><h3>Run your projects</h3><p>Goals, milestones, updates, and collaborators stay attached to the work.</p></div><div><Users /><h3>Find your people</h3><p>Discover creators by discipline, skills, location, and availability.</p></div><div><MessageSquareText /><h3>Share useful progress</h3><p>A community feed designed around building—not empty self-promotion.</p></div><div><Compass /><h3>Discover opportunities</h3><p>Browse roles, local collaborations, paid work, and community events.</p></div></section>

      <section className="public-section showcase" id="community"><div className="section-heading"><span className="eyebrow">CREATOR NETWORK</span><h2>Find collaborators who understand the work.</h2><p>Creator profiles show what people make, what they can contribute, and how they prefer to collaborate.</p></div><div className="creator-grid public-grid">{profiles.slice(1,4).map(profile=><CreatorCard key={profile.id} profile={profile} />)}</div><div className="center-action"><Link className="button button-outline" to="/login">Browse creator profiles</Link></div></section>

      <section className="public-section projects-showcase"><div className="section-heading"><span className="eyebrow">PROJECT DIRECTORY</span><h2>Join projects with a real plan.</h2><p>Public project pages make the goal, current stage, needs, and expected commitment clear.</p></div><div className="project-grid public-grid">{projects.slice(0,3).map(project=><ProjectCard key={project.id} project={project} />)}</div></section>

      <section className="public-section safety-section" id="safety"><div><span className="eyebrow"><ShieldCheck size={15} /> PROFESSIONAL BY DESIGN</span><h2>A community built for useful collaboration.</h2><p>Clear project scopes, compensation labels, reporting controls, public guidelines, and accountable profiles help CreatorOS stay focused on genuine creative work.</p><Link className="text-link" to="/community-guidelines">Read the community guidelines <ArrowRight size={16} /></Link></div><div className="safety-card"><h3>CreatorOS expectations</h3>{['Credit collaborators clearly','Label paid and unpaid work honestly','Respect boundaries and response times','Share constructive, specific feedback','Report scams, harassment, and unsafe behavior'].map(item=><span key={item}><CheckCircle2 size={17} /> {item}</span>)}</div></section>

      <section className="public-section final-cta"><span className="eyebrow">FOUNDING BETA</span><h2>Bring the project.<br />CreatorOS helps you move it forward.</h2><p>Join the first community shaping the future CreatorOS application.</p><Link className="button large" to="/login">Join CreatorOS <ArrowRight size={18} /></Link></section>
    </main>
    <footer className="public-footer"><Brand /><p>CreatorOS is a professional community and workspace for independent creators.</p><nav><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/community-guidelines">Guidelines</Link><a href="mailto:support@creatoros.community">Support</a></nav><small>© 2026 CreatorOS. Prototype release.</small></footer>
  </div>
}

export function LegalPage({ type }: { type: 'privacy' | 'terms' | 'guidelines' }) {
  const content = {
    privacy: { title: 'Privacy Policy', intro: 'This prototype includes a release-ready policy structure that must be completed with the owner’s legal identity, domain, support contact, processors, and retention rules before public launch.', sections: [
      ['Information we collect','Account details, creator profile information, project content, collaboration activity, device and security information, and communications you choose to submit.'],
      ['How information is used','To provide accounts, public profiles, projects, community features, moderation, security, support, and product improvements.'],
      ['Social sign-in','When you use a supported OAuth provider, CreatorOS receives the identity information authorized through that provider. CreatorOS does not receive your provider password.'],
      ['Your controls','Members should be able to edit their profile, disconnect providers, export data, and request account deletion.'],
    ] },
    terms: { title: 'Terms of Service', intro: 'These terms are a prototype framework and require legal review before accepting paying customers or operating at scale.', sections: [
      ['Using CreatorOS','Members must provide accurate information, follow community rules, respect other users, and use the platform for lawful creative work.'],
      ['Your content','Creators retain ownership of their work and grant CreatorOS only the permissions needed to host, display, and operate requested features.'],
      ['Collaboration listings','CreatorOS provides discovery and workflow tools but is not automatically a party to agreements between members. Compensation and scope should be documented clearly.'],
      ['Account action','CreatorOS may restrict or remove accounts that create safety, fraud, copyright, or platform-integrity risks.'],
    ] },
    guidelines: { title: 'Community Guidelines', intro: 'CreatorOS should feel like a professional creative workspace—not an anonymous promotion server.', sections: [
      ['Be honest about the opportunity','Clearly label compensation, scope, deadlines, location, and expected commitment.'],
      ['Respect creators and their work','No harassment, hate, threats, impersonation, plagiarism, or pressure to provide unpaid work under false pretenses.'],
      ['Give useful feedback','Be specific, constructive, and focused on the creator’s stated goals.'],
      ['Protect privacy and safety','Do not publish private information, private messages, personal addresses, or confidential project files without permission.'],
    ] },
  }[type]
  return <div className="legal-page"><header><Brand /><Link className="button button-outline" to="/">Back home</Link></header><main><span className="eyebrow">CREATOROS</span><h1>{content.title}</h1><p className="legal-intro">{content.intro}</p>{content.sections.map(([title,body])=><section key={title}><h2>{title}</h2><p>{body}</p></section>)}</main></div>
}
