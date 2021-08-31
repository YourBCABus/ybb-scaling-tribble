import classes from '../styles/Footer.module.scss';

export default function Footer() {
    return <footer className={classes.footer}>
        <a href="https://about.yourbcabus.com" target="_blank" rel="noreferrer">
            <h6>The YourBCABus Team</h6>
            <p>Anthony Li, Edward Feng, Skyler Calaman</p>
        </a>
    </footer>;
}
