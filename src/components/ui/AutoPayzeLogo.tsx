export default function Logo() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 800 650"
			width="100%"
			height="100%"
		>
			<defs>
				<linearGradient id="grad-left-arch" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stop-color="#00D2FF" />
					<stop offset="50%" stop-color="#0066FF" />
					<stop offset="100%" stop-color="#1A103C" />
				</linearGradient>

				<linearGradient
					id="grad-right-arch"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="100%"
				>
					<stop offset="0%" stop-color="#2B00A4" />
					<stop offset="60%" stop-color="#8033FF" />
					<stop offset="100%" stop-color="#C077FF" />
				</linearGradient>

				<linearGradient id="grad-arrow" x1="0%" y1="100%" x2="100%" y2="0%">
					<stop offset="0%" stop-color="#3B46F6" />
					<stop offset="50%" stop-color="#00B2FE" />
					<stop offset="100%" stop-color="#00F0FF" />
				</linearGradient>

				<linearGradient id="grad-payze" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stop-color="#00C8FF" />
					<stop offset="50%" stop-color="#4B5EFC" />
					<stop offset="100%" stop-color="#9A3BFF" />
				</linearGradient>
			</defs>

			<g transform="translate(0, -10)">
				<path
					d="M 400 170 L 485 300 C 510 340 525 365 525 380 C 525 390 515 395 490 395 L 440 395 C 430 395 425 390 415 375 L 385 325 Z"
					fill="url(#grad-right-arch)"
				/>

				<path
					d="M 400 170 C 385 170 375 180 365 200 L 290 340 C 275 368 270 382 280 392 C 290 400 305 398 325 392 L 400 320 Z"
					fill="url(#grad-left-arch)"
				/>

				<path
					d="M 275 385 C 275 385 360 330 450 280 L 485 315 L 530 220 L 420 250 L 450 280 C 370 325 295 375 275 385 Z"
					fill="url(#grad-arrow)"
				/>
			</g>

			<g transform="translate(0, 10)">
				<text
					x="400"
					y="495"
					text-anchor="end"
					font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Montserrat', 'Inter', sans-serif"
					font-weight="800"
					font-size="78"
					fill="#FFFFFF"
					letter-spacing="-1.5"
				>
					Auto
				</text>
				<text
					x="395"
					y="495"
					text-anchor="start"
					font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Montserrat', 'Inter', sans-serif"
					font-weight="800"
					font-size="78"
					fill="url(#grad-payze)"
					letter-spacing="-1.5"
				>
					Payze
				</text>
			</g>

			<text
				x="400"
				y="555"
				text-anchor="middle"
				font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
				font-weight="500"
				font-size="20"
				fill="#E2E8F0"
				letter-spacing="4.5"
			>
				Set It. Pay It. Automatically.
			</text>
		</svg>
	);
}
