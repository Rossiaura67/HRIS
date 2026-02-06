"use client";

import React from "react";
import styles from "@/app/dashboard/employee/employee.module.css";

interface CardProps {
    title?: string;
    children: React.ReactNode;
    className?: string; 
}

export const Card = ({ title, children, className = "" }: CardProps) => {
    return (
        <div className={`${styles.panelCard} ${className}`}>
            {title && (
                <h2 className={styles.panelTitle}>
                    {title}
                </h2>
            )}
            <div className={styles.cardContent}>
                {children}
            </div>
        </div>
    );
};