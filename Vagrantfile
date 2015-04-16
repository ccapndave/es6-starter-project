# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

$script = <<SCRIPT
sudo apt-get update
sudo apt-get install -y npm git
sudo ln -s /usr/bin/nodejs /usr/bin/node
sudo npm install -g gulp
SCRIPT

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  # Base box
  config.vm.box = "ubuntu/trusty64"

  # Forward port 8080 to the host (webserver)
  config.vm.network "forwarded_port", guest: 8080, host: 8080

  # Forward port 35729 to the host (live reload)
  config.vm.network "forwarded_port", guest: 35729, host: 35729

  # Run the provisioning commands
  config.vm.provision "shell", inline: $script
end

