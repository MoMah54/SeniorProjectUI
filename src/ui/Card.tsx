// src/ui/Card.tsx
import React from "react";
import { colors, radius, spacing, typography } from "./tokens";
import "./ui.css";

type CardProps = {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    right?: React.ReactNode;
    style?: React.CSSProperties;
    padding?: number;
    hoverable?: boolean;
};

export default function Card({
    children,
    title,
    subtitle,
    right,
    style,
    padding = spacing.lg,
    hoverable = true,
}: CardProps) {
    return (
        <div
            className={`ui-card ${hoverable ? "ui-card--hover" : ""}`}
            style={{
                padding,
                borderRadius: radius.md,
                color: colors.textPrimary,
                fontFamily: typography.fontFamily,
                ...style,
            }}
        >
            {(title || subtitle || right) && (
                <div style={{ display: "flex", justifyContent: "space-between", gap: spacing.md, marginBottom: spacing.md }}>
                    <div style={{ minWidth: 0 }}>
                        {title && <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>}
                        {subtitle && <div style={{ marginTop: 6, color: colors.textSecondary, fontSize: 13 }}>{subtitle}</div>}
                    </div>
                    {right ? <div style={{ flex: "0 0 auto" }}>{right}</div> : null}
                </div>
            )}
            {children}
        </div>
    );
}