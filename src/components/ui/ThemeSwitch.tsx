import { useEffect, useState } from "react";
import styles from "./ThemeSwitch.module.css";

interface ThemeSwitchProps {
    onChange: () => void;
    checked: boolean;
}

export function ThemeSwitch({ onChange, checked }: ThemeSwitchProps) {
    // Avoid hydration mismatch by waiting for mount
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={styles.themeSwitch} style={{ width: "5.625em", height: "2.5em" }} />;
    }

    return (
        <label className={`${styles.themeSwitch} cursor-pointer`}>
            <input type="checkbox" className={styles.checkbox} checked={checked} onChange={onChange} />
            <div className={styles.container}>
                <div className={styles.clouds}></div>
                <div className={styles.starsContainer}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 55" fill="none">
                        <path fill="currentColor" d="M138.142 26.858l5.858 5.858-5.858 5.858-5.858-5.858 5.858-5.858zM109 23.491l5.858 5.858-5.858 5.858-5.858-5.858L109 23.491zM93.307 2.143l5.858 5.858-5.858 5.858-5.858-5.858 5.858-5.858zM60.142 34.858l5.858 5.858-5.858 5.858-5.858-5.858 5.858-5.858zM24.142 2.858l5.858 5.858-5.858 5.858-5.858-5.858 5.858-5.858zM26.142 42.858l5.858 5.858-5.858 5.858-5.858-5.858 5.858-5.858z"></path>
                    </svg>
                </div>
                <div className={styles.circleContainer}>
                    <div className={styles.sunMoonContainer}>
                        <div className={styles.moon}>
                            <div className={styles.spot}></div>
                            <div className={styles.spot}></div>
                            <div className={styles.spot}></div>
                        </div>
                    </div>
                </div>
            </div>
        </label>
    );
}
