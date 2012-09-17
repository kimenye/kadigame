class CreatePlayers < ActiveRecord::Migration
  def self.up
    create_table :players do |t|
      t.string :fb_id
      t.text :name
      t.timestamps
    end
  end

  def self.down
    drop_table :players
  end
end
