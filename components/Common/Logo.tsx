import Image from "next/image";
import clsx from "clsx";
import aopsLogo from "@/images/logos/aops_conseil.png";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ ...props }) => {
  return (
    <Image
      className={clsx(`${props.className}`)}
      src={aopsLogo}
      width={props.width}
      height={props.height}
      priority
      alt="Aops Conseil"
    />
  );
};

export default Logo;
