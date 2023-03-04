import Link from "next/link";
import React from "react";

export interface LinkWrapIfInterface {
    show: boolean;
    href: string;
    children: JSX.Element;
}

const LinkWrapIf: React.FC<LinkWrapIfInterface> = (
    { show, href, children }: LinkWrapIfInterface
): JSX.Element  => {
    if (show) {
        return (
            <Link href={href}>
                {children}
            </Link>
        );
    } else return children;
};

export default LinkWrapIf;
