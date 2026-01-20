import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <text
                x="12"
                y="18"
                textAnchor="middle"
                fontSize="20"
                fill="currentColor"
            >
                🍆
            </text>
        </svg>
    );
}
