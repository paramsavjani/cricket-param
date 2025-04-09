"use client";

import { useState, useEffect } from "react";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  LogOut,
  Wallet,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  ShieldCheck,
  Download,
} from "lucide-react";

// MetaMask icon
const MetaMaskIcon = (
  <img
    src="/metamask.webp"
    alt="MetaMask"
    className=" w-10"
  />
);

export function ConnectButton() {
  const { address, connector, isConnected, chain } = useAccount();
  const { connect, connectors, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isMetaMaskInstallDialogOpen, setIsMetaMaskInstallDialogOpen] =
    useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] =
    useState<boolean>(false);

  // Check if MetaMask is installed
  useEffect(() => {
    const checkMetaMaskAvailability = () => {
      // Check if window.ethereum exists and has the isMetaMask property
      const isAvailable =
        typeof window !== "undefined" &&
        window.ethereum &&
        window.ethereum.isMetaMask;

      setIsMetaMaskAvailable(!!isAvailable);
    };

    checkMetaMaskAvailability();
  }, []);

  // Filter connectors to only include MetaMask
  const metaMaskConnector = connectors.find(
    (c) => c.name === "MetaMask" || c.id === "metaMask" || c.id === "injected"
  );

  // Format address for display
  const formatAddress = (addr: string | undefined): string => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Copy address to clipboard
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get etherscan or block explorer URL
  const getExplorerUrl = (): string => {
    if (!address || !chain?.blockExplorers?.default?.url) return "#";
    return `${chain.blockExplorers.default.url}/address/${address}`;
  };

  // Handle connect button click
  const handleConnectClick = () => {
    if (isMetaMaskAvailable) {
      setIsDialogOpen(true);
    } else {
      setIsMetaMaskInstallDialogOpen(true);
    }
  };

  // If connected, show the account dropdown
  if (isConnected && address) {
    return (
      <TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 h-10 px-4 transition-all hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-500 border-green-500/20 px-1.5 py-0 h-5 mr-1"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />
                  <span className="text-xs">{chain?.name || "Connected"}</span>
                </Badge>
                <Avatar className="h-6 w-6 border border-border">
                  <AvatarImage
                    src={`https://effigy.im/a/${address}.svg`}
                    alt="Avatar"
                  />
                  <AvatarFallback>
                    <Wallet className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{formatAddress(address)}</span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span>Connected Wallet</span>
                <Badge variant="outline" className="font-normal">
                  {connector?.name || "Wallet"}
                </Badge>
              </div>
              <div className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                <Avatar className="h-4 w-4 mr-1">
                  <AvatarImage
                    src={`https://effigy.im/a/${address}.svg`}
                    alt="Avatar"
                  />
                  <AvatarFallback>
                    <Wallet className="h-2 w-2" />
                  </AvatarFallback>
                </Avatar>
                {formatAddress(address)}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuItem
                    className="flex items-center justify-between cursor-pointer"
                    onClick={copyAddress}
                  >
                    <div className="flex items-center gap-2">
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span>{copied ? "Copied!" : "Copy Address"}</span>
                    </div>
                    <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Copy your wallet address</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuItem
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => window.open(getExplorerUrl(), "_blank")}
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      <span>View on Explorer</span>
                    </div>
                    <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>View your wallet on block explorer</p>
                </TooltipContent>
              </Tooltip>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 "
              onClick={() => disconnect()}
            >
              <LogOut className="h-4 w-4" />
              <span>Disconnect</span>
              <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    );
  }

  // If not connected, show the connect button that opens dialog
  return (
    <>
      <Button
        onClick={handleConnectClick}
        className="flex items-center gap-2"
        size="default"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>

      {/* MetaMask Connection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Connect Your Wallet
            </DialogTitle>
            <DialogDescription>
              Connect with MetaMask to use this application.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 flex items-start gap-2 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Connection Error</p>
                <p>{error.message}</p>
              </div>
            </div>
          )}

          <div className="grid gap-4 py-2">
            {metaMaskConnector && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center w-24 gap-3">
                        {MetaMaskIcon}
                        <div>
                          <CardTitle className="text-base">MetaMask</CardTitle>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter className="p-4 pt-2 flex justify-end">
                    <Button
                      onClick={() => {
                        connect({ connector: metaMaskConnector });
                        setIsDialogOpen(false);
                      }}
                      disabled={isPending}
                      variant="default"
                      size="sm"
                      className="gap-2"
                    >
                      {isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Connecting...
                        </>
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              <span>Your wallet is only used for secure authentication</span>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MetaMask Install Dialog */}
      <Dialog
        open={isMetaMaskInstallDialogOpen}
        onOpenChange={setIsMetaMaskInstallDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              MetaMask Required
            </DialogTitle>
            <DialogDescription>
              MetaMask is not installed. Please install MetaMask to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 flex flex-col items-center gap-4">
            {MetaMaskIcon}
            <div className="text-center">
              <p className="font-medium mb-2">MetaMask Not Detected</p>
              <p className="text-sm text-muted-foreground">
                This application requires MetaMask to connect your wallet.
                Please install MetaMask and then return to this site.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsMetaMaskInstallDialogOpen(false)}
              className="sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                window.open("https://metamask.io/download/", "_blank")
              }
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Install MetaMask
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
